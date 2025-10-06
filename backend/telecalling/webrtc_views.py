# Real WebRTC API endpoints for Exotel integration
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.conf import settings
import requests
import json
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
@login_required
def initiate_webrtc_call(request):
    """
    Initiate a real WebRTC call using Exotel REST API
    """
    try:
        data = json.loads(request.body)
        to_number = data.get('to')
        from_number = data.get('from')
        custom_field = data.get('customField')
        
        if not to_number:
            return JsonResponse({
                'success': False,
                'error': 'Phone number is required'
            }, status=400)
        
        exotel_config = settings.EXOTEL_CONFIG
        
        # Check if Exotel is configured
        required_fields = ['account_sid', 'api_key', 'api_token', 'caller_id']
        missing_fields = [field for field in required_fields if not exotel_config.get(field)]
        
        if missing_fields:
            return JsonResponse({
                'success': False,
                'error': f'Exotel configuration incomplete. Missing: {missing_fields}'
            }, status=400)
        
        # Prepare Exotel API request for WebRTC calling
        exotel_subdomain = exotel_config.get('subdomain', 'api.exotel.com')
        url = f"https://{exotel_subdomain}/v1/Accounts/{exotel_config['account_sid']}/Calls/connect.json"
        
        # WebRTC-specific call parameters
        call_data = {
            'From': from_number or exotel_config.get('agent_number', ''),
            'To': to_number,
            'CallerId': exotel_config['caller_id'],
            'Record': 'true',
            'StatusCallback': exotel_config.get('webhook_url', ''),
            'StatusCallbackContentType': 'application/json',
            'StatusCallbackEvents[0]': 'initiated',
            'StatusCallbackEvents[1]': 'ringing',
            'StatusCallbackEvents[2]': 'answered',
            'StatusCallbackEvents[3]': 'completed',
            'StatusCallbackEvents[4]': 'busy',
            'StatusCallbackEvents[5]': 'no-answer',
            'StatusCallbackEvents[6]': 'failed',
            'CustomField': custom_field or '',
            # WebRTC specific parameters
            'WebRTC': 'true',
            'BridgeMode': 'true',  # Enable bridge mode for WebRTC
            'AudioCodec': 'opus',  # Use Opus codec for better quality
            'SampleRate': '48000',  # High quality audio
        }
        
        logger.info(f"Initiating WebRTC call: {to_number}")
        
        # Make request to Exotel
        response = requests.post(
            url,
            data=call_data,
            auth=(exotel_config['api_key'], exotel_config['api_token']),
            timeout=30
        )
        
        if response.status_code == 200:
            exotel_response = response.json()
            call_sid = exotel_response.get('Call', {}).get('Sid')
            bridge_url = exotel_response.get('Call', {}).get('BridgeUrl')
            
            logger.info(f"WebRTC call initiated successfully: {call_sid}")
            
            return JsonResponse({
                'success': True,
                'callSid': call_sid,
                'bridgeUrl': bridge_url,
                'status': 'initiated',
                'message': 'WebRTC call initiated successfully'
            })
        else:
            error_message = f"Exotel API error: {response.status_code} - {response.text}"
            logger.error(error_message)
            return JsonResponse({
                'success': False,
                'error': error_message
            }, status=500)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error initiating WebRTC call: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Network error: {str(e)}'
        }, status=500)
    except Exception as e:
        logger.error(f"Error initiating WebRTC call: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)

@require_http_methods(["GET"])
@login_required
def get_call_status(request, call_sid):
    """
    Get real-time call status from Exotel
    """
    try:
        exotel_config = settings.EXOTEL_CONFIG
        exotel_subdomain = exotel_config.get('subdomain', 'api.exotel.com')
        
        # Get call details from Exotel
        url = f"https://{exotel_subdomain}/v1/Accounts/{exotel_config['account_sid']}/Calls/{call_sid}.json"
        
        response = requests.get(
            url,
            auth=(exotel_config['api_key'], exotel_config['api_token']),
            timeout=10
        )
        
        if response.status_code == 200:
            call_data = response.json().get('Call', {})
            
            return JsonResponse({
                'success': True,
                'status': call_data.get('Status', 'unknown'),
                'duration': call_data.get('Duration', 0),
                'recordingUrl': call_data.get('RecordingUrl', ''),
                'bridgeUrl': call_data.get('BridgeUrl', ''),
                'direction': call_data.get('Direction', ''),
                'from': call_data.get('From', ''),
                'to': call_data.get('To', ''),
                'startTime': call_data.get('StartTime', ''),
                'endTime': call_data.get('EndTime', '')
            })
        else:
            return JsonResponse({
                'success': False,
                'error': f'Failed to get call status: {response.status_code}'
            }, status=500)
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error getting call status: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Network error: {str(e)}'
        }, status=500)
    except Exception as e:
        logger.error(f"Error getting call status: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
@login_required
def end_call(request, call_sid):
    """
    End an active call via Exotel API
    """
    try:
        exotel_config = settings.EXOTEL_CONFIG
        exotel_subdomain = exotel_config.get('subdomain', 'api.exotel.com')
        
        # End call via Exotel API
        url = f"https://{exotel_subdomain}/v1/Accounts/{exotel_config['account_sid']}/Calls/{call_sid}.json"
        
        response = requests.post(
            url,
            data={'Status': 'completed'},
            auth=(exotel_config['api_key'], exotel_config['api_token']),
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info(f"Call ended successfully: {call_sid}")
            return JsonResponse({
                'success': True,
                'message': 'Call ended successfully'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': f'Failed to end call: {response.status_code}'
            }, status=500)
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error ending call: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Network error: {str(e)}'
        }, status=500)
    except Exception as e:
        logger.error(f"Error ending call: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
@login_required
def mute_call(request, call_sid):
    """
    Mute/unmute a call via Exotel API
    """
    try:
        data = json.loads(request.body)
        muted = data.get('muted', False)
        
        exotel_config = settings.EXOTEL_CONFIG
        exotel_subdomain = exotel_config.get('subdomain', 'api.exotel.com')
        
        # Mute/unmute call via Exotel API
        url = f"https://{exotel_subdomain}/v1/Accounts/{exotel_config['account_sid']}/Calls/{call_sid}.json"
        
        response = requests.post(
            url,
            data={'Muted': 'true' if muted else 'false'},
            auth=(exotel_config['api_key'], exotel_config['api_token']),
            timeout=10
        )
        
        if response.status_code == 200:
            action = 'muted' if muted else 'unmuted'
            logger.info(f"Call {action} successfully: {call_sid}")
            return JsonResponse({
                'success': True,
                'message': f'Call {action} successfully'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': f'Failed to mute/unmute call: {response.status_code}'
            }, status=500)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error muting call: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Network error: {str(e)}'
        }, status=500)
    except Exception as e:
        logger.error(f"Error muting call: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
@login_required
def hold_call(request, call_sid):
    """
    Hold/resume a call via Exotel API
    """
    try:
        data = json.loads(request.body)
        on_hold = data.get('onHold', False)
        
        exotel_config = settings.EXOTEL_CONFIG
        exotel_subdomain = exotel_config.get('subdomain', 'api.exotel.com')
        
        # Hold/resume call via Exotel API
        url = f"https://{exotel_subdomain}/v1/Accounts/{exotel_config['account_sid']}/Calls/{call_sid}.json"
        
        response = requests.post(
            url,
            data={'Hold': 'true' if on_hold else 'false'},
            auth=(exotel_config['api_key'], exotel_config['api_token']),
            timeout=10
        )
        
        if response.status_code == 200:
            action = 'held' if on_hold else 'resumed'
            logger.info(f"Call {action} successfully: {call_sid}")
            return JsonResponse({
                'success': True,
                'message': f'Call {action} successfully'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': f'Failed to hold/resume call: {response.status_code}'
            }, status=500)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error holding call: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Network error: {str(e)}'
        }, status=500)
    except Exception as e:
        logger.error(f"Error holding call: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)

