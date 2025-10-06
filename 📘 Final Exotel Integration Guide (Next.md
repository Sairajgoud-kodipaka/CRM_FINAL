# **📘 Final Exotel Integration Guide (Next.js \+ Django CRM)**

This guide provides a comprehensive walkthrough for integrating Exotel's Voice and WhatsApp services into your Next.js \+ Django CRM. It includes architecture, compliance notes, code implementation, and best practices derived directly from the official Exotel documentation.

### **1\. Services We’re Using**

* **Voice (Telecaller use case)**  
  * **API Endpoint:** `https://<subdomain>/v1/Accounts/<your_sid>/Calls/connect.json`  
  * **Features:** Click-to-Call, bridging agent to customer, custom Applets for call flows, call recordings, and real-time status webhooks.  
* **WhatsApp (Marketing use case)**  
  * **API Endpoint:** `https://<subdomain>/v2/Accounts/<your_sid>/Messages.json`  
  * **Features:** Pre-approved template messages, rich media (images, videos, documents), interactive buttons and lists, and delivery/read receipt webhooks.

### **2\. Role-Based Usage**

* **Telecaller → Voice Service:**  
  * Initiates calls to customers directly from a CRM contact's page.  
  * The system automatically logs call duration, status, and recording links.  
* **Marketing Team → WhatsApp Service:**  
  * Sends approved marketing campaigns, appointment reminders, and follow-ups.  
  * Tracks message engagement through `sent`, `delivered`, and `read` statuses.

### **3\. Legal & Compliance Notes**

* **TRAI Regulations:** Caller ID masking is strictly prohibited in India. Your registered ExoPhone must be displayed as the Caller ID.  
* **Call Recording:** You must inform the customer that the call may be recorded for quality or training purposes. The Exotel API provides a `RecordingUrl` which you must download and store in your own infrastructure (e.g., S3 bucket). **Crucially, request Exotel support to enable auto-purging of recordings from their servers** to ensure you control the data.  
* **DPDPA (India's Privacy Law):** You must obtain and log explicit customer consent (opt-in) before sending any marketing communications via WhatsApp. This consent status should be stored against the customer's record in your CRM.

### **4\. Code Implementation: Django (Backend) & Next.js (Frontend)**

Here are the core code snippets to get your developers started.

#### **Backend: Django Views (`/backend/exotel/views/`)**

**`call_view.py` \- Initiating a Voice Call (Enhanced)**

import os

import requests

from django.http import JsonResponse

from django.views import View

from django.utils.decorators import method\_decorator

from django.views.decorators.csrf import csrf\_exempt

import json

@method\_decorator(csrf\_exempt, name='dispatch')

class InitiateCallView(View):

    def post(self, request, \*args, \*\*kwargs):

        try:

            data \= json.loads(request.body)

            agent\_number \= data.get('agent\_number')

            customer\_number \= data.get('customer\_number')

            \# NEW: Pass a custom field for tracking, e.g., a lead\_id from your CRM

            custom\_field \= data.get('custom\_field') 

            if not agent\_number or not customer\_number:

                return JsonResponse({'error': 'Agent and customer numbers are required'}, status=400)

            exotel\_sid \= os.getenv('EXOTEL\_SID')

            exotel\_api\_key \= os.getenv('EXOTEL\_API\_KEY')

            exotel\_api\_token \= os.getenv('EXOTEL\_API\_TOKEN')

            exotel\_caller\_id \= os.getenv('EXOTEL\_CALLER\_ID')

            status\_callback\_url \= os.getenv('EXOTEL\_VOICE\_STATUS\_CALLBACK')

            \# NEW: Use the subdomain from .env for region-specific endpoint

            exotel\_subdomain \= os.getenv('EXOTEL\_SUBDOMAIN', 'api.exotel.com')

            payload \= {

                'From': agent\_number,

                'To': customer\_number,

                'CallerId': exotel\_caller\_id,

                'StatusCallback': status\_callback\_url,

                'Record': 'true',

                \# NEW: Request JSON webhooks for easier parsing

                'StatusCallbackContentType': 'application/json',

                \# NEW: Explicitly subscribe to terminal events

                'StatusCallbackEvents\[0\]': 'terminal',

                'StatusCallbackEvents\[1\]': 'answered'

            }

            

            \# Add custom field to payload if it exists

            if custom\_field:

                payload\['CustomField'\] \= custom\_field

            response \= requests.post(

                f'https://{exotel\_subdomain}/v1/Accounts/{exotel\_sid}/Calls/connect.json',

                auth=(exotel\_api\_key, exotel\_api\_token),

                data=payload

            )

            response\_data \= response.json()

            if response.status\_code \== 200:

                call\_sid \= response\_data.get('Call', {}).get('Sid')

                \# Log call\_sid and custom\_field to your CallLog model for easy tracking

                return JsonResponse({'success': True, 'message': 'Call initiated successfully', 'sid': call\_sid}, status=200)

            else:

                return JsonResponse({'success': False, 'error': response\_data}, status=response.status\_code)

        except Exception as e:

            return JsonResponse({'success': False, 'error': str(e)}, status=500)

**`whatsapp_view.py` \- Sending a WhatsApp Message**

import os

import requests

from django.http import JsonResponse

from django.views import View

from django.utils.decorators import method\_decorator

from django.views.decorators.csrf import csrf\_exempt

import json

@method\_decorator(csrf\_exempt, name='dispatch')

class SendWhatsAppView(View):

    def post(self, request, \*args, \*\*kwargs):

        try:

            data \= json.loads(request.body)

            customer\_whatsapp\_number \= data.get('customer\_number')

            template\_id \= data.get('template\_id')

            template\_params \= data.get('template\_params', \[\])

            if not customer\_whatsapp\_number or not template\_id:

                return JsonResponse({'error': 'Customer number and template ID are required'}, status=400)

            exotel\_sid \= os.getenv('EXOTEL\_SID')

            exotel\_api\_key \= os.getenv('EXOTEL\_API\_KEY')

            exotel\_api\_token \= os.getenv('EXOTEL\_API\_TOKEN')

            exotel\_whatsapp\_number \= os.getenv('EXOTEL\_WHATSAPP\_NUMBER')

            exotel\_subdomain \= os.getenv('EXOTEL\_SUBDOMAIN', 'api.exotel.com')

            payload \= {

                "from": exotel\_whatsapp\_number,

                "to": customer\_whatsapp\_number,

                "type": "template",

                "template": {

                    "id": template\_id,

                    "language": "en",

                    "body": {

                        "type": "text",

                        "parameters": template\_params

                    }

                }

            }

            response \= requests.post(

                f'https://{exotel\_subdomain}/v2/Accounts/{exotel\_sid}/Messages.json',

                auth=(exotel\_api\_key, exotel\_api\_token),

                json=payload

            )

            response\_data \= response.json()

            if response.status\_code \== 200:

                message\_sid \= response\_data.get('message', {}).get('sid')

                return JsonResponse({'success': True, 'message': 'WhatsApp message sent', 'sid': message\_sid}, status=200)

            else:

                return JsonResponse({'success': False, 'error': response\_data}, status=response.status\_code)

        except Exception as e:

            return JsonResponse({'success': False, 'error': str(e)}, status=500)

#### **Frontend: Next.js Component (`/frontend/components/`)**

**`CallButton.tsx` \- A React component to trigger the call (Enhanced)**

import React, { useState } from 'react';

interface CallButtonProps {

  agentNumber: string;

  customerNumber: string;

  // NEW: Pass a unique ID from your CRM for tracking

  trackingId?: string;

}

const CallButton: React.FC\<CallButtonProps\> \= ({ agentNumber, customerNumber, trackingId }) \=\> {

  const \[callStatus, setCallStatus\] \= useState\<string\>('');

  const \[isLoading, setIsLoading\] \= useState\<boolean\>(false);

  const handleCall \= async () \=\> {

    setIsLoading(true);

    setCallStatus('Initiating call...');

    try {

      const response \= await fetch('\[https://yourcrm.com/api/exotel/call\](https://yourcrm.com/api/exotel/call)', {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          agent\_number: agentNumber,

          customer\_number: customerNumber,

          custom\_field: trackingId, // NEW: Send the tracking ID to the backend

        }),

      });

      const result \= await response.json();

      if (response.ok) {

        setCallStatus(\`Call initiated successfully\! SID: ${result.sid}\`);

      } else {

        setCallStatus(\`Error: ${result.error?.message || 'Failed to initiate call'}\`);

      }

    } catch (error) {

      console.error('Call API error:', error);

      setCallStatus('An unexpected error occurred.');

    } finally {

      setIsLoading(false);

    }

  };

  return (

    \<div\>

      \<button

        onClick={handleCall}

        disabled={isLoading}

        style={{

          padding: '10px 20px',

          fontSize: '16px',

          cursor: isLoading ? 'not-allowed' : 'pointer',

          backgroundColor: isLoading ? '\#ccc' : '\#007bff',

          color: 'white',

          border: 'none',

          borderRadius: '5px'

        }}

      \>

        {isLoading ? 'Calling...' : 'Call Customer'}

      \</button\>

      {callStatus && \<p style={{ marginTop: '10px' }}\>{callStatus}\</p\>}

    \</div\>

  );

};

export default CallButton;

### **5\. Exotel API Deep Dive & Best Practices**

This section provides specific examples and suggestions based on the official Exotel documentation.

#### **Voice API (`Make-a-Call`)**

* **Connecting Agent to Customer (Bridging):** The code above uses the `/Calls/connect` endpoint, which is the standard method. It first calls the agent (`From`) and, once they answer, dials the customer (`To`).  
* **NEW \- `CustomField` for Tracking:** This is a highly recommended parameter. Pass any internal ID (e.g., `lead_id`, `ticket_id`) in this field. Exotel will return this exact value in the `StatusCallback` webhook, allowing you to instantly associate the call with the correct record in your database without any extra lookups.  
* **NEW \- `StatusCallbackContentType`:** Set this to `application/json` in your request. This makes your webhook endpoint much cleaner, as you can parse a standard JSON body instead of form-data.  
* **NEW \- `StatusCallbackEvents`:** By specifying `['terminal', 'answered']`, you get detailed webhooks when the call is answered and when it ends. The `terminal` event is the most important as it contains the final status, duration, and recording URL.

**Sample `StatusCallback` JSON Payload:** Your webhook endpoint should be prepared to receive a detailed JSON payload like this for a `terminal` event:  
{

  "CallSid": "492205107c5fb48f4ac25d1f77759339",

  "EventType": "terminal",

  "DateCreated": "2019-04-08 03:17:59",

  "DateUpdated": "2019-04-08 03:18:35",

  "Status": "completed",

  "To": "+91886799XXXX",

  "From": "+91941374XXXX",

  "PhoneNumberSid": "0113083XXXX",

  "StartTime": "2019-04-08 03:17:59",

  "EndTime": "2019-04-08 03:18:36",

  "Direction": "outbound-api",

  "RecordingUrl": "\[https://s3-ap-southeast-1.amazonaws.com/exotelrecordings/\](https://s3-ap-southeast-1.amazonaws.com/exotelrecordings/)...",

  "ConversationDuration": 32,

  "CustomField": "your\_tracking\_id\_from\_crm",

  "Legs": \[

    { "OnCallDuration": 41, "Status": "completed" },

    { "OnCallDuration": 32, "Status": "completed" }

  \]

}

* 

#### **WhatsApp API (`v2/Messages`)**

* **Template Structure:** All marketing messages *must* use pre-approved templates. Refer to the Exotel docs for the exact JSON structure for rich media and interactive buttons.

### **6\. Environment Variables Template (`.env`)**

\# Exotel Account

EXOTEL\_SID=your\_sid

EXOTEL\_API\_KEY=your\_api\_key

EXOTEL\_API\_TOKEN=your\_api\_token

\# NEW: Use api.exotel.com for Singapore or api.in.exotel.com for Mumbai

EXOTEL\_SUBDOMAIN=api.exotel.com

\# Voice (Telecaller)

EXOTEL\_CALLER\_ID=+91... \# Your ExoPhone

EXOTEL\_VOICE\_STATUS\_CALLBACK=\[https://yourcrm.com/api/exotel/webhook/voice\](https://yourcrm.com/api/exotel/webhook/voice)

\# WhatsApp (Marketing)

EXOTEL\_WHATSAPP\_NUMBER=+91... \# Your WhatsApp Business Number

EXOTEL\_WHATSAPP\_STATUS\_CALLBACK=\[https://yourcrm.com/api/exotel/webhook/whatsapp\](https://yourcrm.com/api/exotel/webhook/whatsapp)

### **7\. Integration Flow (End-to-End)**

1. **Frontend:** A user clicks the `CallButton`, passing the agent number, customer number, and a unique `trackingId`.  
2. **Frontend → Backend:** The Next.js component calls your Django backend.  
3. **Backend:** The Django view constructs the payload, including the `CustomField`, and makes a secure call to the Exotel API.  
4. **Exotel:** Initiates the two-leg call.  
5. **Exotel Webhook → Backend:** When the call ends, Exotel sends a `terminal` event as a JSON POST request to your `StatusCallback` URL.  
6. **Backend:** Your webhook view parses the JSON, uses the `CustomField` to find the relevant CRM record, and updates it with the call status, `RecordingUrl`, and `ConversationDuration`.  
7. **Frontend:** The UI updates in real-time (via polling or WebSockets) to show the final call log entry.

### **8\. Features, Credits, & Costing**

(This section remains unchanged)

### **9\. Testing Guide**

* **Voice:**  
  1. Use two real phone numbers.  
  2. Trigger a call, passing a `trackingId`.  
  3. Check your `CallLog` model to confirm status updates are saved.  
  4. **Verify that the `CustomField` in the webhook payload matches the `trackingId` you sent.**  
  5. Confirm the `RecordingUrl` is received and downloaded.  
* **WhatsApp:**  
  1. Use an approved template and a test number.  
  2. Verify the message is received and check your logs for `sent` → `delivered` → `read` status updates.

### **10\. Do’s and Don’ts**

✅ **Do’s**

* **Keep Secrets on the Backend:** All Exotel API calls must originate from your Django backend to protect your API Key and Token.  
* **Use Environment Variables:** Store all credentials (`EXOTEL_SID`, `EXOTEL_API_KEY`, etc.) in `.env` files and never hardcode them in your source code.  
* **Implement Idempotent Webhooks:** Design your webhook receivers to handle potential duplicate events gracefully. Use the `CallSid` to check if you've already processed a given event.  
* **Handle Errors Gracefully:** Use `try-except` blocks in your Django views to catch API errors or network issues and return meaningful error messages to the frontend.  
* **Validate All Inputs:** Before making an API call, validate that phone numbers are in the correct format and that WhatsApp template IDs exist.  
* **Own Your Data:** Immediately download call recordings from the `RecordingUrl` provided in the webhook and store them in your own secure infrastructure (e.g., an S3 bucket).  
* **Monitor and Alert:** Actively track your credit usage and set up automated alerts to notify your team when you reach a certain threshold (e.g., 80% usage).  
* **Respect Compliance:** Always inform users about call recordings and get explicit opt-in consent before sending promotional WhatsApp messages to comply with DPDPA and TRAI regulations.

❌ **Don’ts**

* **Never Expose Credentials:** Do not embed your `EXOTEL_API_KEY` or `TOKEN` in any part of your Next.js frontend application.  
* **Don't Trust API Success Codes Blindly:** A `200 OK` from the `/connect` API only means the request was accepted. Rely on the `StatusCallback` webhook for the true, final status of the call (`completed`, `failed`, `no-answer`).  
* **Don't Ignore Rate Limits:** Be mindful of Exotel's API rate limits. For bulk operations (e.g., large WhatsApp campaigns), implement a queueing system to send requests at a steady pace.  
* **Don't Block Webhook Responses:** Your webhook endpoint should process the incoming data quickly (e.g., by pushing it to a background job) and return a `200 OK` response to Exotel immediately. Long-running processes can cause timeouts.  
* **Don't Send Unapproved WhatsApp Templates:** All promotional or template-based WhatsApp messages must be pre-approved by Meta. Sending unapproved templates will result in an API error.  
* **Don't Assume Webhooks Always Succeed:** Network issues can prevent webhooks from reaching your server. Consider building a fallback mechanism that periodically polls the Exotel API for the status of recent calls that haven't received a webhook.

Perfect — here’s your **Exotel Credit Usage Calculator Table** so you and your team can forecast how far your **500 trial credits** will stretch.

---

# **📊 Exotel Credit Usage Calculator**

| Service | Quantity | Estimated Credits Used | Remaining Credits (from 500\) |
| ----- | ----- | ----- | ----- |
| **Voice Call** | 1‑minute call | 2 credits | 498 |
| **Voice Call** | 2‑minute call | 4 credits | 496 |
| **Voice Call** | 5‑minute call | 10 credits | 490 |
| **Voice Call** | 10‑minute call | 20 credits | 480 |
| **WhatsApp Msg** | 1 message | 1 credit | 499 |
| **WhatsApp Msg** | 10 messages | 10 credits | 490 |
| **WhatsApp Msg** | 100 messages | 100 credits | 400 |
| **WhatsApp Msg** | 500 messages | 500 credits | 0 |
| **Mixed Usage** | 100 calls of 2 minutes each | 400 credits | 100 |
| **Mixed Usage** | 200 WhatsApp messages | 200 credits | 300 |
| **Mixed Usage** | 50 calls (2 min) \+ 300 WhatsApp messages | 500 credits | 0 |

---

## **🔑 How This Works**

* **Voice calls**: Charged **per minute per leg**.  
  * 1 call \= 2 legs (agent \+ customer).  
  * So a 1‑minute call \= 2 credits, a 2‑minute call \= 4 credits, etc.  
* **WhatsApp messages**: Charged **per outbound message** (template).  
  * 1 message \= 1 credit.  
* **Trial credits**: You have **500 credits** to test both services.

---

## **✅ What This Means for You**

* **Telecallers**: If average call \= 2 minutes, you can make \~125 calls with 500 credits.  
* **Marketing**: If average campaign \= 100 messages, you can send \~5 campaigns with 500 credits.  
* **Mixed usage**: You’ll need to balance — e.g., 50 calls (2 min each) \+ 300 WhatsApp messages \= exactly 500 credits.

---

👉 Next step: Do you want me to **add this calculator logic into your CRM admin dashboard** (so admins can see “Credits Remaining” in real time)? That way, your ops team won’t get caught off guard when credits run low.

