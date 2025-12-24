from rest_framework import serializers
from .models import Client, ClientInteraction, Appointment, FollowUp, Task, Announcement, CustomerTag, AuditLog
from apps.tenants.models import Tenant
from .models import Purchase
from shared.validators import validate_international_phone_number, normalize_phone_number
import re


class ClientSerializer(serializers.ModelSerializer):
    # Handle frontend field mapping
    name = serializers.CharField(write_only=True, required=False)
    leadSource = serializers.CharField(write_only=True, required=False, source='lead_source')
    reasonForVisit = serializers.CharField(write_only=True, required=False, source='reason_for_visit')
    ageOfEndUser = serializers.CharField(write_only=True, required=False, source='age_of_end_user')
    source = serializers.CharField(write_only=True, required=False, source='lead_source')  # Map source to lead_source
    nextFollowUp = serializers.CharField(write_only=True, required=False, source='next_follow_up')
    summaryNotes = serializers.CharField(write_only=True, required=False, source='summary_notes', allow_null=True, allow_blank=True)
    assigned_to = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    customer_preference = serializers.CharField(write_only=True, required=False, source='customer_preferences', allow_null=True, allow_blank=True)
    
    # Add missing field mappings
    community = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    catchment_area = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    next_follow_up_time = serializers.CharField(required=False, allow_blank=True, allow_null=True, help_text="Time in HH:MM format")
    saving_scheme = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # Explicitly define all fields except tenant
    first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(
        required=False, 
        allow_blank=True, 
        allow_null=True,
        validators=[validate_international_phone_number]
    )
    customer_type = serializers.CharField(required=False, default='individual')
    status = serializers.CharField(required=False, default='general')
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    full_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    state = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    country = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    postal_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    anniversary_date = serializers.DateField(required=False, allow_null=True)
    preferred_metal = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    preferred_stone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ring_size = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    budget_range = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    lead_source = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    reason_for_visit = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    age_of_end_user = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    next_follow_up = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    summary_notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    # New import/transaction fields
    # sr_no = serializers.CharField(required=False, allow_blank=True, allow_null=True)  # Removed - not in CSV and migration not applied
    area = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    client_category = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    preferred_flag = serializers.BooleanField(required=False, default=False)
    attended_by = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    item_category = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    item_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    visit_date = serializers.DateField(required=False, allow_null=True)
    tags = serializers.SerializerMethodField(read_only=True)
    tag_slugs = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True,
        help_text="List of tag slugs to assign to the client"
    )
    customer_interests = serializers.SerializerMethodField()
    customer_interests_display = serializers.SerializerMethodField()
    customer_interests_input = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True,
        help_text="List of customer interest data as JSON strings"
    )
    # Store field for store-based visibility
    store = serializers.PrimaryKeyRelatedField(
        queryset=Client._meta.get_field('store').related_model.objects.all(),
        required=False,
        allow_null=True,
        help_text="Store this customer belongs to"
    )
    
    # Created by field to show who created the customer
    created_by = serializers.SerializerMethodField()
    
    # Store name field for display
    store_name = serializers.SerializerMethodField()
    
    # Pipeline stage field - get the latest pipeline stage for this customer
    pipeline_stage = serializers.SerializerMethodField()
    
    def get_created_by(self, obj):
        if obj.created_by:
            return {
                'id': obj.created_by.id,
                'first_name': obj.created_by.first_name,
                'last_name': obj.created_by.last_name,
                'username': obj.created_by.username
            }
        return None
    
    def get_store_name(self, obj):
        if obj.store:
            return obj.store.name
        return None
    
    def get_pipeline_stage(self, obj):
        """Get the latest pipeline stage for this customer"""
        try:
            # Check if pipelines are already prefetched
            if hasattr(obj, '_prefetched_objects_cache') and 'pipelines' in obj._prefetched_objects_cache:
                # Use prefetched pipelines
                pipelines = obj._prefetched_objects_cache['pipelines']
                if pipelines:
                    # Get the most recent pipeline (already sorted by updated_at in model Meta)
                    latest_pipeline = max(pipelines, key=lambda p: p.updated_at)
                    return latest_pipeline.stage
            else:
                # Query pipelines if not prefetched
                latest_pipeline = obj.pipelines.order_by('-updated_at').first()
                if latest_pipeline:
                    return latest_pipeline.stage
            return None
        except Exception as e:
            # Log error but don't break the serializer
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Error getting pipeline stage for client {obj.id}: {str(e)}")
            return None
    
    def validate_date_of_birth(self, value):
        """Handle empty strings for date_of_birth field"""
        if value == "" or value is None:
            return None
        return value
    
    def validate_anniversary_date(self, value):
        """Handle empty strings for anniversary_date field"""
        if value == "" or value is None:
            return None
        return value
    
    def validate_phone(self, value):
        """Validate and normalize phone number, and check for duplicates if creating new customer"""
        if not value:
            return value
        
        # Check if this is an import operation - skip normalization to preserve original format
        is_import = self.context.get('is_import', False)
        request = self.context.get('request')
        if request:
            path = getattr(request, 'path', '')
            if 'import' in path.lower() or request.path.endswith('/import/'):
                is_import = True
        
        # For imports, default to India (+91) for numbers without country code
        if is_import:
            # For imports, default to India (+91) for numbers without country code
            digits_only = re.sub(r'\D', '', str(value))
            
            # If it's a 10-digit number, assume it's Indian
            if len(digits_only) == 10:
                normalized = f'+91{digits_only}'
            # If it starts with 91 and has 12 digits, it's already Indian format
            elif digits_only.startswith('91') and len(digits_only) == 12:
                normalized = f'+{digits_only}'
            # If it has 11 digits and starts with 0, remove 0 and add +91
            elif len(digits_only) == 11 and digits_only.startswith('0'):
                normalized = f'+91{digits_only[1:]}'
            # If it already starts with +, use standard normalization
            elif str(value).strip().startswith('+'):
                normalized = normalize_phone_number(value)
            # For any other number without country code, assume it's Indian and add +91
            elif len(digits_only) >= 7 and len(digits_only) <= 12:
                # Default to India for imports - add +91 prefix
                normalized = f'+91{digits_only}'
            else:
                # Use standard normalization as fallback
                normalized = normalize_phone_number(value)
        else:
            # For manual form submissions, always normalize
            normalized = normalize_phone_number(value)
        
        # Check for duplicate phone number (only on create, not update)
        instance = getattr(self, 'instance', None)
        if instance is None:  # This is a create operation
            if request and hasattr(request, 'user') and request.user.is_authenticated:
                tenant = request.user.tenant
                if tenant:
                    existing_client = Client.objects.filter(
                        phone=normalized,
                        tenant=tenant,
                        is_deleted=False
                    ).first()
                    
                    if existing_client:
                        # Don't block creation, but store info for frontend warning
                        # Frontend will show suggestion to use existing customer or proceed
                        self._existing_phone_customer = {
                            'id': existing_client.id,
                            'name': existing_client.full_name,
                            'email': existing_client.email or 'No email',
                            'status': existing_client.get_status_display(),
                            'phone': existing_client.phone
                        }
        
        return normalized
    
    def validate(self, attrs):
        """General validation to handle empty strings for date fields"""
        # Convert empty strings to None for date fields
        for field_name in ['date_of_birth', 'anniversary_date']:
            if field_name in attrs and attrs[field_name] == "":
                attrs[field_name] = None
        
        return attrs
    
    def get_customer_interests_display(self, obj):
        """Get customer interests for display"""
        try:
            interests = obj.interests.all()
            return [
                {
                    'id': interest.id,
                    'category': interest.category.name if interest.category else None,
                    'product': interest.product.name if interest.product else None,
                    'revenue': float(interest.revenue) if interest.revenue else 0,
                    'notes': interest.notes,
                    'preferences': self._extract_preferences_from_notes(interest.notes),
                    'status': self._determine_interest_status(interest.notes)
                }
                for interest in interests
            ]
        except Exception as e:
            print(f"Error getting customer interests display: {e}")
            return []
    
    def get_customer_interests(self, obj):
        """Get customer interests in the format expected by frontend"""
        try:
            interests = obj.interests.all()
            return [
                {
                    'id': interest.id,
                    'category': {
                        'id': interest.category.id if interest.category else None,
                        'name': interest.category.name if interest.category else None
                    },
                    'product': {
                        'id': interest.product.id if interest.product else None,
                        'name': interest.product.name if interest.product else None
                    },
                    'revenue': float(interest.revenue) if interest.revenue else 0,
                    'notes': interest.notes,
                    'preferences': self._extract_preferences_from_notes(interest.notes),
                    'status': self._determine_interest_status(interest.notes),
                    'is_purchased': interest.is_purchased,
                    'is_not_purchased': interest.is_not_purchased,
                    'purchased_at': interest.purchased_at.isoformat() if interest.purchased_at else None,
                    'not_purchased_at': interest.not_purchased_at.isoformat() if interest.not_purchased_at else None,
                    'related_sale_id': interest.related_sale.id if interest.related_sale else None
                }
                for interest in interests
            ]
        except Exception as e:
            print(f"Error getting customer interests: {e}")
            return []
    
    def _extract_preferences_from_notes(self, notes):
        """Extract preferences from notes field"""
        if not notes:
            return {
                'designSelected': False,
                'wantsDiscount': False,
                'checkingOthers': False,
                'lessVariety': False,
                'purchased': False,
                'other': ''
            }
        
        preferences = {
            'designSelected': 'Design Selected' in notes,
            'wantsDiscount': 'Wants More Discount' in notes,
            'checkingOthers': 'Checking Other Jewellers' in notes,
            'lessVariety': 'Felt Less Variety' in notes,
            'purchased': 'Purchased' in notes,
            'other': ''
        }
        
        # Extract other preferences
        if 'Other:' in notes:
            try:
                other_part = notes.split('Other:')[1].strip()
                if other_part and other_part != 'None':
                    preferences['other'] = other_part
            except:
                pass
        
        return preferences
    
    def _determine_interest_status(self, notes):
        """Determine interest status based on preferences"""
        if not notes:
            return 'interested'
        
        # Check for purchased first (highest priority)
        if 'Purchased' in notes:
            return 'closed_won'
        
        # Check for negotiation indicators
        negotiation_indicators = [
            'Wants More Discount',
            'Checking Other Jewellers', 
            'Felt Less Variety'
        ]
        
        if any(indicator in notes for indicator in negotiation_indicators):
            return 'negotiation'
        
        # Check for design selected (interested)
        if 'Design Selected' in notes:
            return 'interested'
        
        # Default to interested if no specific indicators
        return 'interested'

    def validate_tag_slugs(self, value):
        """Validate that all tag slugs exist in the database"""
        if value:
            from .models import CustomerTag
            existing_slugs = CustomerTag.objects.filter(slug__in=value).values_list('slug', flat=True)
            missing_slugs = set(value) - set(existing_slugs)
            if missing_slugs:
                raise serializers.ValidationError(f"Tags with slugs {missing_slugs} do not exist in the database.")
        return value

    def validate_tags(self, value):
        """Validate that all tag slugs exist in the database (for backward compatibility)"""
        return self.validate_tag_slugs(value)
    
    def validate_email(self, value):
        """
        Check that the email is unique per tenant.
        """
        print(f"=== VALIDATING EMAIL: {value} ===")
        
        # Handle empty strings and None
        if not value or value == "" or value.strip() == "":
            return None
            
        # Get the current request context to check tenant
        request = self.context.get('request')
        if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
            print("No authenticated user, skipping email validation")
            return value
            
        tenant = request.user.tenant
        if not tenant:
            print("User has no tenant, skipping email validation")
            return value
            
        # Check if email already exists for this tenant
        from .models import Client
        existing_client = Client.objects.filter(
            email=value, 
            tenant=tenant,
            is_deleted=False
        ).first()
        
        if existing_client:
            # If this is an update operation, allow the same email for the same client
            if hasattr(self, 'instance') and self.instance and self.instance.id == existing_client.id:
                print(f"Email validation passed for update operation")
                return value
            # For create with duplicate email, coerce to None instead of erroring
            print(f"Duplicate email '{value}' for tenant {tenant} detected – coercing to None (treat as no email)")
            return None
        
        print(f"Email validation passed: '{value}' is unique for tenant {tenant}")
        return value
    
    class Meta:
        model = Client
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone', 'customer_type', 'status',
            'address', 'full_address', 'city', 'state', 'country', 'postal_code',
            'date_of_birth', 'anniversary_date', 'preferred_metal', 'preferred_stone',
            'ring_size', 'budget_range', 'lead_source', 'notes', 'community',
            'mother_tongue', 'reason_for_visit', 'age_of_end_user', 'next_follow_up', 'summary_notes',
            'created_at', 'updated_at',
            # Frontend field mappings
            'name', 'leadSource', 'reasonForVisit', 'ageOfEndUser', 'source', 
            'nextFollowUp', 'summaryNotes', 'assigned_to', 'customer_preference',
            'tags', 'tag_slugs',
            # Store information
            'store', 'store_name',
            # New import/transaction fields
            # 'sr_no',  # Temporarily commented out - uncomment after running migration 0031_add_import_transaction_fields
            'area', 'client_category', 'preferred_flag', 'attended_by',
            'item_category', 'item_name', 'visit_date',
            'catchment_area', 'next_follow_up_time', 'saving_scheme',
            # Store field for store-based visibility
            'store', 'store_name',
            # User who created the customer
            'created_by',
            # Exhibition relationship
            'exhibition',
            # Customer interests
            'customer_interests', 'customer_interests_display', 'customer_interests_input',
            # Soft delete fields
            'is_deleted', 'deleted_at',
            # Additional fields from AddCustomerModal
            'pincode', 'sales_person', 'sales_person_id', 'customer_status',
            'product_type', 'style', 'material_type', 'material_weight', 'material_value', 'material_unit',
            'product_subtype', 'customer_preferences',
            # Pipeline stage
            'pipeline_stage',
        ]
        # created_at is read-only by default, but we handle it specially in create() for imports
        read_only_fields = ['id', 'created_at', 'updated_at', 'tags', 'is_deleted', 'deleted_at', 'created_by']
    
    def create(self, validated_data):
        print("=== BACKEND SERIALIZER - CREATE METHOD START ===")
        print(f"Initial validated_data keys: {list(validated_data.keys())}")
        print(f"Initial validated_data: {validated_data}")
        print(f"Fields being processed:")
        print(f"  - sales_person: {validated_data.get('sales_person')}")
        print(f"  - product_type: {validated_data.get('product_type')}")
        print(f"  - let_him_visit: {validated_data.get('let_him_visit')}")
        print(f"  - design_number: {validated_data.get('design_number')}")
        print(f"  - customer_interests_input in validated_data: {'customer_interests_input' in validated_data}")
        if 'customer_interests_input' in validated_data:
            print(f"  - customer_interests_input value: {validated_data.get('customer_interests_input')}")
            print(f"  - customer_interests_input type: {type(validated_data.get('customer_interests_input'))}")
        
        # Handle created_at for imports - get from context (extracted in to_internal_value)
        # Also check context in case it was passed from view
        created_at = None
        created_at_str = getattr(self, '_import_created_at', None)
        if not created_at_str:
            # Try to get from context (passed from view)
            context = getattr(self, 'context', {})
            created_at_str = context.get('import_created_at')
            if created_at_str:
                print(f"Got created_at from context: {created_at_str}")
        if created_at_str:
            try:
                from django.utils.dateparse import parse_datetime, parse_date
                from django.utils import timezone
                from datetime import datetime, date
                
                # Strip any leading/trailing quotes (single or double) from date string
                created_at_str = created_at_str.strip().strip("'").strip('"').strip()
                print(f"🔍 SERIALIZER: Attempting to parse created_at: '{created_at_str}'")
                
                created_at = None
                parsed_date = None
                
                # PRIORITY 1: Try DD-MM-YYYY format FIRST (most common for CSV imports like '28-08-2025)
                try:
                    parsed_date = datetime.strptime(created_at_str, '%d-%m-%Y').date()
                    print(f"✅ SERIALIZER: Parsed DD-MM-YYYY date: {parsed_date}")
                except ValueError:
                    try:
                        # Try DD/MM/YYYY format
                        parsed_date = datetime.strptime(created_at_str, '%d/%m/%Y').date()
                        print(f"✅ SERIALIZER: Parsed DD/MM/YYYY date: {parsed_date}")
                    except ValueError:
                        # PRIORITY 2: Try parse_date (for ISO format YYYY-MM-DD)
                        parsed_date = parse_date(created_at_str)
                        if parsed_date:
                            print(f"✅ SERIALIZER: Parsed ISO date: {parsed_date}")
                        else:
                            # PRIORITY 3: Try parse_datetime (for datetime strings)
                            created_at = parse_datetime(created_at_str)
                            if created_at:
                                print(f"✅ SERIALIZER: Parsed datetime: {created_at}")
                            else:
                                # PRIORITY 4: Try other formats
                                try:
                                    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                                    print(f"✅ SERIALIZER: Parsed using fromisoformat: {created_at}")
                                except:
                                    # Try other formats
                                    for fmt in [
                                        '%Y-%m-%dT%H:%M:%S', 
                                        '%Y-%m-%d %H:%M:%S', 
                                        '%Y-%m-%d', 
                                        '%Y/%m/%d',
                                        '%d-%m-%Y %H:%M:%S',
                                    ]:
                                        try:
                                            created_at = datetime.strptime(created_at_str, fmt)
                                            print(f"✅ SERIALIZER: Parsed using format {fmt}: {created_at}")
                                            break
                                        except:
                                            continue
                
                # Convert parsed_date to datetime if we got a date
                if parsed_date and not created_at:
                    created_at = datetime.combine(parsed_date, datetime.min.time())
                    print(f"✅ SERIALIZER: Converted date to datetime: {created_at}")
                
                if created_at:
                    # Make timezone-aware if naive
                    if timezone.is_naive(created_at):
                        # Use the default timezone (usually UTC or server timezone)
                        created_at = timezone.make_aware(created_at)
                    print(f"Final created_at (timezone-aware): {created_at}")
                else:
                    print(f"WARNING: Could not parse created_at string: '{created_at_str}'")
            except Exception as e:
                import traceback
                print(f"ERROR parsing created_at '{created_at_str}': {e}")
                print(traceback.format_exc())
                created_at = None
        
        # Email optional: allow None/blank
        if 'email' in validated_data and (validated_data['email'] == '' or validated_data['email'] is None):
            validated_data['email'] = None

        # Handle name field mapping
        if 'name' in validated_data:
            name = validated_data.pop('name')
            print(f"Processing name field: '{name}'")
            # Split name into first and last name
            name_parts = name.strip().split(' ', 1)
            validated_data['first_name'] = name_parts[0]
            validated_data['last_name'] = name_parts[1] if len(name_parts) > 1 else ''
            print(f"Split name - first_name: '{validated_data['first_name']}', last_name: '{validated_data['last_name']}'")
        
        # Handle customer interests
        customer_interests_data = []
        if 'customer_interests_input' in validated_data:
            interests_value = validated_data.pop('customer_interests_input')
            print(f"🔍 Customer interests found in validated_data: {interests_value}")
            print(f"🔍 Type: {type(interests_value)}")
            print(f"🔍 Is None: {interests_value is None}")
            print(f"🔍 Is empty list: {interests_value == []}")
            print(f"🔍 Length (if list): {len(interests_value) if isinstance(interests_value, list) else 'N/A'}")
            
            # Handle both list and single value - even if empty list, we want to process it
            if interests_value is not None:
                if isinstance(interests_value, list):
                    customer_interests_data = interests_value
                    print(f"✅ Stored {len(customer_interests_data)} customer interests (list) for later processing")
                elif isinstance(interests_value, str):
                    # Single JSON string
                    customer_interests_data = [interests_value]
                    print(f"✅ Stored 1 customer interest (string) for later processing")
                else:
                    customer_interests_data = [interests_value] if interests_value else []
                    print(f"✅ Stored {len(customer_interests_data)} customer interests (other type) for later processing")
            else:
                print(f"⚠️ customer_interests_input is None - will skip processing")
                customer_interests_data = []
        elif 'customer_interests' in validated_data:
            print(f"Customer interests found (legacy field): {validated_data['customer_interests']}")
            customer_interests_data = validated_data.pop('customer_interests')
            if not isinstance(customer_interests_data, list):
                customer_interests_data = [customer_interests_data] if customer_interests_data else []
            print(f"Stored customer interests for later processing: {customer_interests_data}")
        else:
            print(f"⚠️ No customer_interests_input field found in validated_data")
            print(f"Available fields: {list(validated_data.keys())}")
        
        # Also check for interests field (frontend might send it differently)
        if 'interests' in validated_data:
            print(f"Interests field found: {validated_data['interests']}")
            customer_interests_data = validated_data.pop('interests')
            if not isinstance(customer_interests_data, list):
                customer_interests_data = [customer_interests_data] if customer_interests_data else []
            print(f"Stored interests for later processing: {customer_interests_data}")
        
        # Handle assigned_to field
        if 'assigned_to' in validated_data:
            assigned_to_value = validated_data['assigned_to']
            if assigned_to_value is None or assigned_to_value == '':
                validated_data.pop('assigned_to')
                print("Removed empty assigned_to field")
            elif assigned_to_value == 'current_user':
                # Assign to the current user
                request = self.context.get('request')
                if request and hasattr(request, 'user') and request.user.is_authenticated:
                    validated_data['assigned_to'] = request.user
                    print(f"Assigned customer to current user: {request.user}")
                else:
                    validated_data.pop('assigned_to')
                    print("No authenticated user, removed assigned_to field")
            else:
                # Try to find user by username or ID (scoped to tenant)
                try:
                    from apps.users.models import User
                    request = self.context.get('request')
                    tenant = request.user.tenant if request and hasattr(request, 'user') and request.user.is_authenticated else None
                    
                    if assigned_to_value.isdigit():
                        # Lookup by ID, but verify it's in the same tenant
                        user = User.objects.get(id=int(assigned_to_value))
                        if tenant and user.tenant != tenant:
                            raise User.DoesNotExist(f"User {assigned_to_value} not in same tenant")
                    else:
                        # Lookup by username, scoped to tenant
                        if tenant:
                            user = User.objects.get(username=assigned_to_value, tenant=tenant)
                        else:
                            user = User.objects.get(username=assigned_to_value)
                    validated_data['assigned_to'] = user
                    print(f"Assigned customer to user: {user.username} ({user.get_full_name() or user.username})")
                except User.DoesNotExist:
                    validated_data.pop('assigned_to')
                    print(f"User '{assigned_to_value}' not found in tenant, removed assigned_to field")
        
        # ALWAYS assign tenant in create method
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            tenant = request.user.tenant
            if tenant:
                validated_data['tenant'] = tenant
                print(f"Assigned user's tenant in create: {tenant}")
            else:
                print("User has no tenant, creating default in create")
                from apps.tenants.models import Tenant
                tenant, created = Tenant.objects.get_or_create(
                    name='Default Tenant',
                    defaults={'slug': 'default-tenant', 'is_active': True}
                )
                validated_data['tenant'] = tenant
                print(f"Created default tenant in create: {tenant}")
            
            # ALWAYS assign store in create method
            store = request.user.store
            if store:
                validated_data['store'] = store
                print(f"Assigned user's store in create: {store}")
            else:
                print("User has no store, store will be null")
            
            # Don't assign created_by here - let the view's perform_create handle it
            # This allows the view to set the correct salesperson
            print(f"Not setting created_by in serializer - will be handled by view's perform_create")
        else:
            print("No authenticated user, creating default tenant in create")
            from apps.tenants.models import Tenant
            tenant, created = Tenant.objects.get_or_create(
                name='Default Tenant',
                defaults={'slug': 'default-tenant', 'is_active': True}
            )
            validated_data['tenant'] = tenant
            print(f"Created default tenant for unauthenticated user in create: {tenant}")
            # Store will be null for unauthenticated users
        
        # Ensure preferred_flag is always set to False if not provided or None
        # This is critical because the database column has a NOT NULL constraint
        if 'preferred_flag' not in validated_data:
            validated_data['preferred_flag'] = False
            print(f"Set preferred_flag to False (field was missing)")
        elif validated_data.get('preferred_flag') is None:
            validated_data['preferred_flag'] = False
            print(f"Set preferred_flag to False (was None)")
        # Ensure it's a boolean, not a string or other type
        if not isinstance(validated_data.get('preferred_flag'), bool):
            validated_data['preferred_flag'] = bool(validated_data.get('preferred_flag', False))
            print(f"Converted preferred_flag to boolean: {validated_data['preferred_flag']}")
        
        print(f"Final validated data before save: {validated_data}")
        print(f"preferred_flag value: {validated_data.get('preferred_flag')} (type: {type(validated_data.get('preferred_flag'))})")
        
        try:
            result = super().create(validated_data)
            
            # Set created_at if provided (for historical imports)
            # CRITICAL: Must use update_fields to override auto_now_add
            if created_at:
                result.created_at = created_at
                result.save(update_fields=['created_at'])
                print(f"✅ SERIALIZER: Set created_at to: {created_at}")
                # Verify it was saved
                result.refresh_from_db()
                print(f"✅ SERIALIZER: Verified created_at from DB: {result.created_at}")
            else:
                # Fallback: check if it was preserved in context
                preserved_date = getattr(self, '_import_created_at', None)
                if preserved_date:
                    try:
                        from django.utils.dateparse import parse_datetime, parse_date
                        from django.utils import timezone
                        from datetime import datetime
                        
                        # Strip quotes from preserved_date (handles '28-08-2025 format)
                        preserved_date = str(preserved_date).strip().strip("'").strip('"').strip()
                        print(f"🔍 SERIALIZER FALLBACK: Processing preserved_date: '{preserved_date}'")
                        
                        # Try DD-MM-YYYY format FIRST (most common for CSV imports)
                        parsed_date = None
                        try:
                            parsed_date = datetime.strptime(preserved_date, '%d-%m-%Y').date()
                            print(f"✅ SERIALIZER FALLBACK: Parsed DD-MM-YYYY date: {parsed_date}")
                        except ValueError:
                            try:
                                parsed_date = datetime.strptime(preserved_date, '%d/%m/%Y').date()
                                print(f"✅ SERIALIZER FALLBACK: Parsed DD/MM/YYYY date: {parsed_date}")
                            except ValueError:
                                # Try parse_date (for ISO format)
                                parsed_date = parse_date(preserved_date)
                                if parsed_date:
                                    print(f"✅ SERIALIZER FALLBACK: Parsed ISO date: {parsed_date}")
                                else:
                                    print(f"⚠️ SERIALIZER FALLBACK: Could not parse preserved date: '{preserved_date}'")
                        
                        if parsed_date:
                            created_at_dt = datetime.combine(parsed_date, datetime.min.time())
                            if timezone.is_naive(created_at_dt):
                                created_at_dt = timezone.make_aware(created_at_dt)
                            result.created_at = created_at_dt
                            result.save(update_fields=['created_at'])
                            print(f"✅ SERIALIZER: Set created_at from preserved value: {created_at_dt}")
                            # Verify it was saved
                            result.refresh_from_db()
                            print(f"✅ SERIALIZER: Verified created_at from DB: {result.created_at}")
                    except Exception as e:
                        print(f"⚠️ Could not set created_at from preserved value: {e}")
                        import traceback
                        print(traceback.format_exc())
            
            print(f"=== BACKEND SERIALIZER - CREATE SUCCESS ===")
            print(f"Created client: {result}")
            
            # Process customer interests after client creation
            # Check if customer_interests_data exists and is not empty
            if customer_interests_data is not None and len(customer_interests_data) > 0:
                print(f"=== PROCESSING CUSTOMER INTERESTS ===")
                print(f"Processing {len(customer_interests_data)} customer interests for client {result.id}")
                print(f"Raw customer_interests_data: {customer_interests_data}")
                print(f"Type of customer_interests_data: {type(customer_interests_data)}")
                print(f"Length of customer_interests_data: {len(customer_interests_data)}")
                
                # Ensure we have a list
                if not isinstance(customer_interests_data, list):
                    print(f"WARNING: customer_interests_data is not a list: {type(customer_interests_data)}")
                    customer_interests_data = [customer_interests_data] if customer_interests_data else []
                
                from .models import CustomerInterest
                
                # For new customers, check existing interests to avoid duplicates
                existing_interests = CustomerInterest.objects.filter(client=result)
                existing_identifiers = set()
                for existing in existing_interests:
                    identifier = f"{existing.category.name}_{existing.product.name}_{existing.revenue}"
                    existing_identifiers.add(identifier)
                    print(f"   Existing interest: {existing.category.name} - {existing.product.name} (₹{existing.revenue})")
                
                new_interests_created = 0
                for i, interest_data in enumerate(customer_interests_data):
                    try:
                        print(f"\n--- Processing interest {i+1}/{len(customer_interests_data)} ---")
                        # Parse the JSON string if it's a string
                        if isinstance(interest_data, str):
                            import json
                            interest_data = json.loads(interest_data)
                            print(f"Parsed JSON string to: {interest_data}")
                        
                        print(f"Processing interest data: {interest_data}")
                        
                        # Map frontend field names to backend model fields
                        category = interest_data.get('category') or interest_data.get('mainCategory')
                        products = interest_data.get('products', [])
                        preferences = interest_data.get('preferences', {})
                        
                        print(f"Processing category: '{category}' with {len(products)} products")
                        print(f"Products data: {products}")
                        
                        # Validate that we have both category and products
                        if not category or not str(category).strip():
                            print(f"⚠️ Skipping interest: category is empty")
                            continue
                        
                        if not products or len(products) == 0:
                            print(f"⚠️ Skipping interest: no products found")
                            continue
                        
                        if category and products:
                            print(f"✅ Processing {len(products)} products for category '{category}'")
                            products_processed = 0
                            for product_info in products:
                                product_name = product_info.get('product')
                                revenue = product_info.get('revenue')
                                
                                print(f"Product info: name='{product_name}', revenue='{revenue}'")
                                print(f"Product info type: {type(product_name)}, revenue type: {type(revenue)}")
                                
                                # Skip if product name is empty
                                if not product_name or not str(product_name).strip():
                                    print(f"⚠️ Skipping product: product name is empty")
                                    continue
                                
                                if product_name and (revenue is not None):
                                    try:
                                        # Convert revenue to float, handle empty strings and invalid values
                                        revenue_str = str(revenue).strip()
                                        if revenue_str == '':
                                            # Treat empty as 0
                                            revenue_str = '0'
                                        
                                        try:
                                            revenue_value = float(revenue_str)
                                            if revenue_value < 0:
                                                # Clamp negative to 0
                                                revenue_value = 0.0
                                        except (ValueError, TypeError):
                                            print(f"Invalid revenue value '{revenue}' for product '{product_name}'")
                                            continue
                                        
                                        # Create notes from preferences
                                        preference_notes = []
                                        if preferences.get('designSelected'):
                                            preference_notes.append("Design Selected")
                                        if preferences.get('wantsDiscount'):
                                            preference_notes.append("Wants More Discount")
                                        if preferences.get('checkingOthers'):
                                            preference_notes.append("Checking Other Jewellers")
                                        if preferences.get('lessVariety'):
                                            preference_notes.append("Felt Less Variety")
                                        if preferences.get('other'):
                                            preference_notes.append(f"Other: {preferences['other']}")
                                        
                                        notes = f"Category: {category}. Preferences: {', '.join(preference_notes) if preference_notes else 'None'}"
                                        
                                        print(f"Creating CustomerInterest: category={category}, product={product_name}, revenue={revenue_value}, notes={notes}")
                                        
                                        # Create CustomerInterest with proper field mapping
                                        print(f"About to create CustomerInterest: {interest_data}")
                                        print(f"  - client: {result.id}")
                                        print(f"  - category: {category}")
                                        print(f"  - product: {product_name}")
                                        print(f"  - revenue: {revenue_value}")
                                        print(f"  - tenant: {result.tenant.id if result.tenant else 'None'}")
                                        print(f"  - notes: {notes}")
                                        
                                        try:
                                            # Find the actual Category and Product objects by name
                                            from apps.products.models import Category, Product
                                            
                                            # Handle category - could be ID or name
                                            category_obj = None
                                            if str(category).isdigit():
                                                # It's an ID, try to find by ID
                                                try:
                                                    category_obj = Category.objects.get(
                                                        id=int(category),
                                                        tenant=result.tenant
                                                    )
                                                    print(f"SUCCESS: Found category by ID: {category_obj}")
                                                except Category.DoesNotExist:
                                                    print(f"WARNING: Category ID {category} not found, will create by name")
                                                    category_obj = None
                                            
                                            if not category_obj:
                                                # Try to find by name (case-insensitive)
                                                category_obj = Category.objects.filter(
                                                    name__iexact=category,
                                                    tenant=result.tenant
                                                ).first()
                                                if category_obj:
                                                    print(f"SUCCESS: Found category by name: {category_obj}")
                                            
                                            if not category_obj:
                                                print(f"WARNING: Category '{category}' not found for tenant {result.tenant}, creating it")
                                                try:
                                                    category_obj = Category.objects.create(
                                                        name=category,
                                                        tenant=result.tenant,
                                                        scope='store' if result.store else 'global'
                                                    )
                                                    print(f"SUCCESS: Created new category: {category_obj}")
                                                except Exception as cat_error:
                                                    print(f"ERROR: Error creating category '{category}': {cat_error}")
                                                    import traceback
                                                    print(f"Category creation traceback: {traceback.format_exc()}")
                                                    # Try to find any existing category as fallback
                                                    category_obj = Category.objects.filter(tenant=result.tenant).first()
                                                    if not category_obj:
                                                        print(f"ERROR: No fallback category available, skipping this interest")
                                                        continue
                                                    print(f"WARNING: Using fallback category: {category_obj}")
                                            
                                            # Handle product - could be ID or name
                                            product_obj = None
                                            if str(product_name).isdigit():
                                                # It's an ID, try to find by ID
                                                try:
                                                    product_obj = Product.objects.get(
                                                        id=int(product_name),
                                                        tenant=result.tenant
                                                    )
                                                    print(f"SUCCESS: Found product by ID: {product_obj}")
                                                except Product.DoesNotExist:
                                                    print(f"WARNING: Product ID {product_name} not found, will create by name")
                                                    product_obj = None
                                            
                                            if not product_obj:
                                                # Try to find by name (case-insensitive)
                                                product_obj = Product.objects.filter(
                                                    name__iexact=product_name,
                                                    tenant=result.tenant
                                                ).first()
                                                if product_obj:
                                                    print(f"SUCCESS: Found product by name: {product_obj}")
                                            
                                            if not product_obj:
                                                print(f"WARNING: Product '{product_name}' not found for tenant {result.tenant}, creating it")
                                                try:
                                                    # Generate unique SKU
                                                    base_sku = f"{category[:3].upper()}-{product_name[:3].upper()}"
                                                    counter = 1
                                                    sku = f"{base_sku}-{result.tenant.id}"
                                                    while Product.objects.filter(sku=sku, tenant=result.tenant).exists():
                                                        sku = f"{base_sku}-{result.tenant.id}-{counter}"
                                                        counter += 1
                                                    
                                                    product_obj = Product.objects.create(
                                                        name=product_name,
                                                        sku=sku,
                                                        description=f"Auto-created product for customer interest",
                                                        category=category_obj,
                                                        cost_price=0.00,
                                                        selling_price=float(revenue_value),
                                                        quantity=0,
                                                        min_quantity=0,
                                                        max_quantity=1000,
                                                        status='active',
                                                        is_featured=False,
                                                        is_bestseller=False,
                                                        additional_images=[],
                                                        tags=[],
                                                        tenant=result.tenant,
                                                        store=result.store,
                                                        scope='store' if result.store else 'global'
                                                    )
                                                    print(f"SUCCESS: Created new product: {product_obj}")
                                                except Exception as prod_error:
                                                    print(f"ERROR: Error creating product '{product_name}': {prod_error}")
                                                    import traceback
                                                    print(f"Product creation traceback: {traceback.format_exc()}")
                                                    # Try to find any existing product as fallback
                                                    product_obj = Product.objects.filter(tenant=result.tenant).first()
                                                    if not product_obj:
                                                        print(f"ERROR: No fallback product available, skipping this interest")
                                                        continue
                                                    print(f"WARNING: Using fallback product: {product_obj}")
                                            
                                            # Create the customer interest
                                            try:
                                                interest, created = CustomerInterest.objects.get_or_create(
                                                    client=result,
                                                    category=category_obj,
                                                    product=product_obj,
                                                    revenue=revenue_value,
                                                    tenant=result.tenant,
                                                    defaults={'notes': notes}
                                                )
                                                if created:
                                                    print(f"SUCCESS: Successfully created new customer interest: {interest}")
                                                    print(f"  - ID: {interest.id}")
                                                    print(f"  - Client: {interest.client.full_name}")
                                                    print(f"  - Category: {interest.category.name if interest.category else 'No Category'}")
                                                    print(f"  - Product: {interest.product.name if interest.product else 'No Product'}")
                                                    print(f"  - Revenue: {interest.revenue}")
                                                else:
                                                    print(f"INFO: Customer interest already exists: {interest}")
                                            except Exception as interest_error:
                                                print(f"ERROR: Error creating customer interest: {interest_error}")
                                                import traceback
                                                print(f"CustomerInterest creation traceback: {traceback.format_exc()}")
                                                continue
                                        except Exception as e:
                                            print(f"ERROR: Error in main processing: {e}")
                                            import traceback
                                            print(f"Main processing traceback: {traceback.format_exc()}")
                                            continue
                                    except (ValueError, TypeError) as e:
                                        print(f"Invalid revenue value '{revenue}' for product '{product_name}': {e}")
                                    except Exception as e:
                                        print(f"ERROR: Error creating CustomerInterest: {e}")
                                        import traceback
                                        print(f"Traceback: {traceback.format_exc()}")
                                        continue
                                else:
                                    print(f"ERROR: Skipping product with missing name or revenue: {product_info}")
                                    print(f"  - product_name: '{product_name}' (truthy: {bool(product_name)})")
                                    print(f"  - revenue: '{revenue}' (truthy: {bool(revenue)})")
                        else:
                            print(f"ERROR: Skipping interest with missing category or products: {interest_data}")
                            print(f"  - category: '{category}' (truthy: {bool(category)})")
                            print(f"  - products: {products} (length: {len(products) if products else 0})")
                    except Exception as e:
                        print(f"ERROR: Error processing customer interest {interest_data}: {e}")
                        import traceback
                        print(f"Traceback: {traceback.format_exc()}")
                        continue
                
                # Log summary of interest processing
                final_interests = CustomerInterest.objects.filter(client=result)
                print(f"✅ Interest processing complete:")
                print(f"   - New interests created in this session: {new_interests_created}")
                print(f"   - Total interests for this client: {final_interests.count()}")
                if final_interests.count() > 0:
                    for interest in final_interests:
                        print(f"     • {interest.category.name if interest.category else 'No Category'}: {interest.product.name if interest.product else 'No Product'} (₹{interest.revenue})")
                else:
                    print(f"   ⚠️ WARNING: No interests were created! Check logs above for errors.")
            else:
                print(f"=== NO CUSTOMER INTERESTS TO PROCESS ===")
                print(f"customer_interests_data is empty or None: {customer_interests_data}")
                print(f"Type: {type(customer_interests_data)}")
                if customer_interests_data is not None:
                    print(f"Length: {len(customer_interests_data) if hasattr(customer_interests_data, '__len__') else 'N/A'}")
            
            return result
        except serializers.ValidationError as e:
            print(f"=== BACKEND SERIALIZER - VALIDATION ERROR ===")
            print(f"Validation error: {e}")
            raise e
        except Exception as e:
            print(f"=== BACKEND SERIALIZER - CREATE ERROR ===")
            print(f"Error creating client: {e}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            
            # Check if it's a database constraint error
            if "duplicate key value violates unique constraint" in str(e):
                if "email" in str(e).lower():
                    raise serializers.ValidationError({
                        'email': 'A customer with this email address already exists. Please use a different email or update the existing customer.'
                    })
                else:
                    raise serializers.ValidationError('A customer with these details already exists. Please check your information and try again.')
            
            # Check if it's the preferred_flag null constraint error
            if "preferred_flag" in str(e).lower() and "null" in str(e).lower():
                print(f"⚠️ CRITICAL: preferred_flag is still NULL! Retrying with explicit False...")
                # Force set it and try again
                validated_data['preferred_flag'] = False
                try:
                    result = super().create(validated_data)
                    print(f"✅ Successfully created client after preferred_flag fix")
                    return result
                except Exception as retry_error:
                    print(f"❌ Retry also failed: {retry_error}")
                    raise serializers.ValidationError('Database error: preferred_flag field issue. Please contact support.')
            
            raise serializers.ValidationError('An error occurred while creating the customer. Please try again.')
    
    def get_tags(self, obj):
        return [
            {
                'slug': tag.slug,
                'name': tag.name,
                'category': tag.category
            }
            for tag in obj.tags.all()
        ]
    

    def update(self, instance, validated_data):
        """Override update method to handle tag updates and customer interests"""
        print(f"=== CLIENT SERIALIZER UPDATE METHOD ===")
        print(f"Instance: {instance}")
        print(f"Validated data: {validated_data}")

        # Optimistic locking: require matching updated_at if provided in request
        request = self.context.get('request') if hasattr(self, 'context') else None
        try:
            incoming_updated_at = None
            if request and isinstance(request.data, dict) and 'updated_at' in request.data:
                incoming_updated_at = request.data.get('updated_at')
            if incoming_updated_at:
                from django.utils.dateparse import parse_datetime
                parsed = parse_datetime(incoming_updated_at) or parse_datetime(str(incoming_updated_at))
                if parsed and getattr(instance, 'updated_at', None) and parsed < instance.updated_at:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({'detail': 'Conflict: this record was modified by someone else. Reload and try again.'})
        except Exception as _:
            pass
        
        # Get user context from serializer context
        user = None
        if hasattr(self, 'context') and self.context:
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                user = request.user
        print(f"User context from serializer: {user}")
        
        # Set the audit log user if available
        if user:
            instance._auditlog_user = user
            print(f"SUCCESS: Set audit log user: {user}")
        else:
            print(f"WARNING: No user context available for audit log")
        
        # Handle customer interests for updates
        customer_interests_data = None
        if 'customer_interests_input' in validated_data:
            print(f"Customer interests found in update: {validated_data['customer_interests_input']}")
            customer_interests_data = validated_data.pop('customer_interests_input')
            print(f"Stored customer interests for processing: {customer_interests_data}")
        elif 'customer_interests' in validated_data:
            print(f"Customer interests found (legacy field) in update: {validated_data['customer_interests']}")
            customer_interests_data = validated_data.pop('customer_interests')
            print(f"Stored customer interests for processing: {customer_interests_data}")
        
        # Handle tag updates
        tag_slugs = validated_data.pop('tag_slugs', None)
        tags = validated_data.pop('tags', None)
        
        print(f"tag_slugs from request: {tag_slugs}")
        print(f"tags from request: {tags}")
        
        # Use tag_slugs if provided, otherwise use tags
        if tag_slugs is not None:
            print(f"Updating tags with tag_slugs: {tag_slugs}")
            # Clear existing tags and set new ones
            instance.tags.clear()
            if tag_slugs and len(tag_slugs) > 0:
                # Get tags by slug
                from .models import CustomerTag
                tags_to_add = CustomerTag.objects.filter(slug__in=tag_slugs)
                print(f"Found tags in database: {[tag.slug for tag in tags_to_add]}")
                if tags_to_add.exists():
                    instance.tags.add(*tags_to_add)
                    print(f"Added tags: {[tag.name for tag in tags_to_add]}")
                else:
                    print("No tags found in database for the provided slugs")
            else:
                print("No tag_slugs provided or empty list")
        elif tags is not None:
            print(f"Updating tags with tags: {tags}")
            # Clear existing tags and set new ones
            instance.tags.clear()
            if tags and len(tags) > 0:
                # Get tags by slug
                from .models import CustomerTag
                tags_to_add = CustomerTag.objects.filter(slug__in=tags)
                print(f"Found tags in database: {[tag.slug for tag in tags_to_add]}")
                if tags_to_add.exists():
                    instance.tags.add(*tags_to_add)
                    print(f"Added tags: {[tag.name for tag in tags_to_add]}")
                else:
                    print("No tags provided or empty list")
        
        # Ensure email is None, not empty string, on update as well
        if 'email' in validated_data:
            email_val = validated_data.get('email')
            if email_val is None:
                pass
            elif isinstance(email_val, str) and email_val.strip() == "":
                validated_data['email'] = None
                print("Normalized update email: empty string -> None")
        
        # Call parent update method for other fields
        result = super().update(instance, validated_data)
        
        # Process customer interests after client update
        if customer_interests_data:
            print(f"=== PROCESSING CUSTOMER INTERESTS IN UPDATE ===")
            print(f"Processing {len(customer_interests_data)} customer interests for client {result.id}")
            print(f"Raw customer_interests_data: {customer_interests_data}")
            
            # Merge new interests with existing ones instead of replacing
            from .models import CustomerInterest
            existing_interests = CustomerInterest.objects.filter(client=result)
            print(f"Found {existing_interests.count()} existing interests - will merge with new ones")
            
            # Ensure we have a list
            if not isinstance(customer_interests_data, list):
                print(f"WARNING: customer_interests_data is not a list: {type(customer_interests_data)}")
                customer_interests_data = [customer_interests_data] if customer_interests_data else []
            
            # Create a set of existing interest identifiers to avoid duplicates
            existing_identifiers = set()
            for existing in existing_interests:
                identifier = f"{existing.category.name}_{existing.product.name}_{existing.revenue}"
                existing_identifiers.add(identifier)
                print(f"   Existing interest: {existing.category.name} - {existing.product.name} (₹{existing.revenue})")
            
            # Process new interests and add them if they don't already exist
            new_interests_created = 0
            for i, interest_data in enumerate(customer_interests_data):
                try:
                    print(f"\n--- Processing interest {i+1}/{len(customer_interests_data)} ---")
                    # Parse the JSON string if it's a string
                    if isinstance(interest_data, str):
                        import json
                        interest_data = json.loads(interest_data)
                        print(f"Parsed JSON string to: {interest_data}")
                    
                    print(f"Processing interest data: {interest_data}")
                    
                    # Map frontend field names to backend model fields
                    category = interest_data.get('category') or interest_data.get('mainCategory')
                    products = interest_data.get('products', [])
                    preferences = interest_data.get('preferences', {})
                    
                    print(f"Processing category: '{category}' with {len(products)} products")
                    print(f"Products data: {products}")
                    
                    if category and products:
                        print(f"Processing {len(products)} products for category '{category}'")
                        for product_info in products:
                            product_name = product_info.get('product')
                            revenue = product_info.get('revenue')
                            
                            print(f"Product info: name='{product_name}', revenue='{revenue}'")
                            
                            if product_name and revenue:
                                try:
                                    # Convert revenue to float, handle empty strings and invalid values
                                    revenue_str = str(revenue).strip()
                                    if not revenue_str or revenue_str == '0' or revenue_str == '0.0':
                                        print(f"Skipping product '{product_name}' with invalid revenue: '{revenue}'")
                                        continue
                                    
                                    try:
                                        revenue_value = float(revenue_str)
                                        if revenue_value <= 0:
                                            print(f"Skipping product '{product_name}' with non-positive revenue: {revenue_value}")
                                            continue
                                    except (ValueError, TypeError):
                                        print(f"Invalid revenue value '{revenue}' for product '{product_name}'")
                                        continue
                                    
                                    # Create notes from preferences
                                    preference_notes = []
                                    if preferences.get('designSelected'):
                                        preference_notes.append("Design Selected")
                                    if preferences.get('wantsDiscount'):
                                        preference_notes.append("Wants More Discount")
                                    if preferences.get('checkingOthers'):
                                        preference_notes.append("Checking Other Jewellers")
                                    if preferences.get('lessVariety'):
                                        preference_notes.append("Felt Less Variety")
                                    if preferences.get('purchased'):
                                        preference_notes.append("Purchased")
                                    if preferences.get('other'):
                                        preference_notes.append(f"Other: {preferences['other']}")
                                    
                                    notes = f"Category: {category}. Preferences: {', '.join(preference_notes) if preference_notes else 'None'}"
                                    
                                    print(f"Creating CustomerInterest: category={category}, product={product_name}, revenue={revenue_value}, notes={notes}")
                                    
                                    # Find the actual Category and Product objects by name
                                    from apps.products.models import Category, Product
                                    
                                    # Handle category - could be ID or name
                                    category_obj = None
                                    if str(category).isdigit():
                                        # It's an ID, try to find by ID
                                        try:
                                            category_obj = Category.objects.get(
                                                id=int(category),
                                                tenant=result.tenant
                                            )
                                            print(f"SUCCESS: Found category by ID: {category_obj}")
                                        except Category.DoesNotExist:
                                            print(f"WARNING: Category ID {category} not found, will create by name")
                                            category_obj = None
                                    
                                    if not category_obj:
                                        # Try to find by name (case-insensitive)
                                        category_obj = Category.objects.filter(
                                            name__iexact=category,
                                            tenant=result.tenant
                                        ).first()
                                        if category_obj:
                                            print(f"SUCCESS: Found category by name: {category_obj}")
                                    
                                    if not category_obj:
                                        print(f"WARNING: Category '{category}' not found for tenant {result.tenant}, creating it")
                                        try:
                                            category_obj = Category.objects.create(
                                                name=category,
                                                tenant=result.tenant,
                                                scope='store' if result.store else 'global'
                                            )
                                            print(f"SUCCESS: Created new category: {category_obj}")
                                        except Exception as cat_error:
                                            print(f"ERROR: Error creating category '{category}': {cat_error}")
                                            # Try to find any existing category as fallback
                                            category_obj = Category.objects.filter(tenant=result.tenant).first()
                                            if not category_obj:
                                                print(f"ERROR: No fallback category available, skipping this interest")
                                                continue
                                            print(f"WARNING: Using fallback category: {category_obj}")
                                    
                                    # Handle product - could be ID or name
                                    product_obj = None
                                    if str(product_name).isdigit():
                                        # It's an ID, try to find by ID
                                        try:
                                            product_obj = Product.objects.get(
                                                id=int(product_name),
                                                tenant=result.tenant
                                            )
                                            print(f"SUCCESS: Found product by ID: {product_obj}")
                                        except Product.DoesNotExist:
                                            print(f"WARNING: Product ID {product_name} not found, will create by name")
                                            product_obj = None
                                    
                                    if not product_obj:
                                        # Try to find by name (case-insensitive)
                                        product_obj = Product.objects.filter(
                                            name__iexact=product_name,
                                            tenant=result.tenant
                                        ).first()
                                        if product_obj:
                                            print(f"SUCCESS: Found product by name: {product_obj}")
                                    
                                    if not product_obj:
                                        print(f"WARNING: Product '{product_name}' not found for tenant {result.tenant}, creating it")
                                        try:
                                            # Generate unique SKU
                                            base_sku = f"{category[:3].upper()}-{product_name[:3].upper()}"
                                            counter = 1
                                            sku = f"{base_sku}-{result.tenant.id}"
                                            while Product.objects.filter(sku=sku, tenant=result.tenant).exists():
                                                sku = f"{base_sku}-{result.tenant.id}-{counter}"
                                                counter += 1
                                            
                                            product_obj = Product.objects.create(
                                                name=product_name,
                                                sku=sku,
                                                description=f"Auto-created product for customer interest",
                                                category=category_obj,
                                                cost_price=0.00,
                                                selling_price=float(revenue_value),
                                                quantity=0,
                                                min_quantity=0,
                                                max_quantity=1000,
                                                status='active',
                                                is_featured=False,
                                                is_bestseller=False,
                                                additional_images=[],
                                                tags=[],
                                                tenant=result.tenant,
                                                store=result.store,
                                                scope='store' if result.store else 'global'
                                            )
                                            print(f"SUCCESS: Created new product: {product_obj}")
                                        except Exception as prod_error:
                                            print(f"ERROR: Error creating product '{product_name}': {prod_error}")
                                            # Try to find any existing product as fallback
                                            product_obj = Product.objects.filter(tenant=result.tenant).first()
                                            if not product_obj:
                                                print(f"ERROR: No fallback product available, skipping this interest")
                                                continue
                                            print(f"WARNING: Using fallback product: {product_obj}")
                                    
                                    # Create the customer interest
                                    try:
                                        # Use get_or_create to avoid duplicates (no need to check existing_identifiers manually)
                                        interest, created = CustomerInterest.objects.get_or_create(
                                            client=result,
                                            category=category_obj,
                                            product=product_obj,
                                            revenue=revenue_value,
                                            tenant=result.tenant,
                                            defaults={'notes': notes}
                                        )
                                        if created:
                                            new_interests_created += 1
                                            print(f"SUCCESS: Successfully created new customer interest: {interest}")
                                            print(f"  - ID: {interest.id}")
                                            print(f"  - Client: {interest.client.full_name}")
                                            print(f"  - Category: {interest.category.name if interest.category else 'No Category'}")
                                            print(f"  - Product: {interest.product.name if interest.product else 'No Product'}")
                                            print(f"  - Revenue: {interest.revenue}")
                                        else:
                                            print(f"INFO: Customer interest already exists: {interest}")
                                    except Exception as interest_error:
                                        print(f"ERROR: Error creating customer interest: {interest_error}")
                                        import traceback
                                        print(f"CustomerInterest creation traceback: {traceback.format_exc()}")
                                        continue
                                except Exception as e:
                                    print(f"ERROR: Error processing product: {e}")
                                    continue
                        else:
                            print(f"ERROR: Skipping interest with missing category or products: {interest_data}")
                except Exception as e:
                    print(f"ERROR: Error processing customer interest {interest_data}: {e}")
                    continue
            
            # Log summary of interest processing
            final_interests = CustomerInterest.objects.filter(client=result)
            print(f"TARGET: Interest processing complete:")
            print(f"   - Existing interests preserved: {existing_interests.count()}")
            print(f"   - New interests created: {new_interests_created}")
            print(f"   - Total interests after update: {final_interests.count()}")
            
            for interest in final_interests:
                print(f"     • {interest.category.name}: {interest.product.name} (₹{interest.revenue})")
        else:
            print(f"=== NO CUSTOMER INTERESTS TO PROCESS IN UPDATE ===")
        
        print(f"=== UPDATE METHOD COMPLETED ===")
        return result

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add full_name for frontend compatibility
        data['name'] = instance.full_name
        # Store name is already included by get_store_name
        # tags already included by get_tags
        return data
    
    def to_internal_value(self, data):
        """
        Override to handle tenant field before validation.
        """
        print(f"=== TO_INTERNAL_VALUE START ===")
        print(f"Input data: {data}")
        
        # Extract created_at from raw data before validation (since it's read-only)
        # Store it in context for use in create() method
        print(f"=== CHECKING FOR created_at IN INPUT DATA ===")
        print(f"Data keys: {list(data.keys())}")
        print(f"'created_at' in data: {'created_at' in data}")
        if 'created_at' in data:
            self._import_created_at = data.pop('created_at')
            print(f"✅ Extracted created_at for import: {self._import_created_at}")
        else:
            self._import_created_at = None
            print(f"❌ No created_at found in input data")
        
        # Remove tenant field from data if it exists
        if 'tenant' in data:
            data.pop('tenant')
            print("Removed tenant field from input data")
        
        # Normalize email: coerce empty string/whitespace to None
        try:
            if 'email' in data:
                email_val = data.get('email')
                if email_val is None:
                    pass
                elif isinstance(email_val, str) and email_val.strip() == "":
                    data['email'] = None
                    print("Normalized email: empty string -> None")
        except Exception as _:
            # Be defensive; don't block request processing on normalization
            pass
        
        # Call parent method
        result = super().to_internal_value(data)
        print(f"=== TO_INTERNAL_VALUE RESULT ===")
        print(f"Result: {result}")
        return result
    
    def validate(self, data):
        """
        Custom validation for the entire data set.
        Validates required fields (marked with * in frontend) while allowing optional fields to be null.
        Skips strict validation during CSV import operations.
        """
        print(f"=== VALIDATING ENTIRE DATA SET ===")
        print(f"Data to validate: {data}")
        
        # Check if this is an import operation (skip strict validation)
        request = self.context.get('request')
        is_import = self.context.get('is_import', False)
        if request:
            # Also check the request path
            path = getattr(request, 'path', '')
            if 'import' in path.lower() or request.path.endswith('/import/'):
                is_import = True
        
        errors = {}
        instance = getattr(self, 'instance', None)
        
        if instance is None:
            # This is a create operation - validate required fields (marked with * in frontend)
            # BUT skip strict validation during CSV import
            
            # For imports, only require name OR phone (at least one)
            if is_import:
                has_name = data.get('first_name') or data.get('last_name')
                has_phone = data.get('phone')
                if not has_name and not has_phone:
                    errors['name'] = "Either name or phone is required"
            else:
                # Check if this is an exhibition lead - skip strict validation
                is_exhibition_lead = (
                    data.get('lead_source') == 'exhibition' or 
                    data.get('status') == 'exhibition'
                )
                
                # Required fields from frontend (marked with * in frontend)
                # 1. Full Name - check first_name (last_name can be empty)
                if not data.get('first_name') or not str(data.get('first_name', '')).strip():
                    errors['first_name'] = "Full Name is required"
                
                # 2. Phone Number
                if not data.get('phone') or not str(data.get('phone', '')).strip():
                    errors['phone'] = "Phone Number is required"
                
                # For exhibition leads, only require name and phone
                if not is_exhibition_lead:
                    # 3. City
                    if not data.get('city') or not str(data.get('city', '')).strip():
                        errors['city'] = "City is required"
                    
                    # 4. State
                    if not data.get('state') or not str(data.get('state', '')).strip():
                        errors['state'] = "State is required"
                    
                    # 5. Catchment Area
                    if not data.get('catchment_area') or not str(data.get('catchment_area', '')).strip():
                        errors['catchment_area'] = "Catchment Area is required"
                    
                    # 6. Sales Person
                    if not data.get('sales_person') or not str(data.get('sales_person', '')).strip():
                        errors['sales_person'] = "Sales Person is required"
                    
                    # 7. Reason for Visit
                    if not data.get('reason_for_visit') or not str(data.get('reason_for_visit', '')).strip():
                        errors['reason_for_visit'] = "Reason for Visit is required"
                    
                    # 8. Lead Source
                    if not data.get('lead_source') or not str(data.get('lead_source', '')).strip():
                        errors['lead_source'] = "Lead Source is required"
                    
                    # 9. Product Type
                    if not data.get('product_type') or not str(data.get('product_type', '')).strip():
                        errors['product_type'] = "Product Type is required"
                
                # 10. Expected Revenue - check customer_interests_input (skip for exhibition leads)
                if not is_exhibition_lead:
                    customer_interests_input = data.get('customer_interests_input', [])
                    has_revenue = False
                    if customer_interests_input:
                        for interest_str in customer_interests_input:
                            try:
                                import json
                                interest_data = json.loads(interest_str)
                                products = interest_data.get('products', [])
                                if products and len(products) > 0:
                                    revenue = products[0].get('revenue', '')
                                    # Treat blank as 0; allow 0 as valid revenue
                                    try:
                                        revenue_str = str(revenue).strip()
                                        if revenue_str == '':
                                            revenue_str = '0'
                                        val = float(revenue_str)
                                        if val >= 0:
                                            has_revenue = True
                                            break
                                    except (ValueError, TypeError):
                                        pass
                            except (json.JSONDecodeError, KeyError, TypeError):
                                pass
                    
                    if not has_revenue:
                        errors['customer_interests_input'] = "Expected Revenue is required (0 allowed)"
            
            # Raise errors if any required fields are missing
            if errors:
                print(f"=== VALIDATION ERRORS: {errors} ===")
                raise serializers.ValidationError(errors)
            
        else:
            # This is an update operation - ensure we maintain at least name OR phone
            current_name = instance.first_name or instance.last_name or ''
            current_phone = instance.phone or ''
            
            # Get updated values
            updated_name = data.get('first_name') or data.get('last_name') or ''
            updated_phone = data.get('phone') or ''
            
            # Final values after update
            final_name = updated_name if updated_name else current_name
            final_phone = updated_phone if updated_phone else current_phone
            
            # Check if update would result in both name and phone being empty
            if not final_name and not final_phone:
                errors['name'] = "At least Name or Phone must be maintained. Update cannot remove both fields."
                print(f"=== UPDATE VALIDATION ERRORS: {errors} ===")
                raise serializers.ValidationError(errors)
        
        # Convert empty strings to None for optional fields to ensure they're stored as null
        optional_fields = [
            'email', 'address', 'last_name', 'date_of_birth', 'anniversary_date',
            'customer_status', 'style', 'customer_preferences', 'design_number',
            'next_follow_up', 'next_follow_up_time', 'summary_notes',
            'age_of_end_user', 'ageing_percentage', 'material_type',
            'material_weight', 'material_value', 'material_unit', 'notes'
        ]
        
        for field in optional_fields:
            if field in data and data[field] is not None:
                if isinstance(data[field], str) and data[field].strip() == '':
                    data[field] = None
        
        print("=== VALIDATION PASSED ===")
        print(f"Final data after validation: {data}")
        return data


class ClientInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientInteraction
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    client_phone = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['tenant', 'created_by', 'created_at', 'updated_at', 'is_deleted', 'deleted_at']

    def get_client_name(self, obj):
        if hasattr(obj.client, 'full_name'):
            return obj.client.full_name
        return str(obj.client)
    
    def get_client_phone(self, obj):
        if obj.client and hasattr(obj.client, 'phone'):
            return obj.client.phone or ''
        return ''

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add computed properties
        data['is_upcoming'] = instance.is_upcoming
        data['is_today'] = instance.is_today
        data['is_overdue'] = instance.is_overdue
        return data


class FollowUpSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = FollowUp
        fields = '__all__'
        read_only_fields = ['tenant', 'created_by', 'created_at', 'updated_at', 'is_deleted', 'deleted_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add computed properties
        data['is_overdue'] = instance.is_overdue
        data['is_due_today'] = instance.is_due_today
        return data

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = '__all__' 

class PurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = '__all__' 

class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    
    class Meta:
        model = AuditLog
        fields = '__all__'


class CustomerTagSerializer(serializers.ModelSerializer):
    """
    Serializer for CustomerTag model
    """
    class Meta:
        model = CustomerTag
        fields = ['id', 'name', 'slug', 'category', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at'] 