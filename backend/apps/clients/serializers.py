from rest_framework import serializers
from .models import Client, ClientInteraction, Appointment, FollowUp, Task, Announcement, CustomerTag, AuditLog
from apps.tenants.models import Tenant
from .models import Purchase


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
    
    # Add missing field mappings
    community = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    catchment_area = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    next_follow_up_time = serializers.CharField(required=False, allow_blank=True, allow_null=True, help_text="Time in HH:MM format")
    saving_scheme = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # Explicitly define all fields except tenant
    first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    customer_type = serializers.CharField(required=False, default='individual')
    status = serializers.CharField(required=False, default='lead')
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
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
    
    def get_created_by(self, obj):
        if obj.created_by:
            return {
                'id': obj.created_by.id,
                'first_name': obj.created_by.first_name,
                'last_name': obj.created_by.last_name,
                'username': obj.created_by.username
            }
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
                    'notes': interest.notes
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
                    'notes': interest.notes
                }
                for interest in interests
            ]
        except Exception as e:
            print(f"Error getting customer interests: {e}")
            return []

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
        
        if not value:
            return value
            
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
            else:
                print(f"Email '{value}' already exists for tenant {tenant}")
                
                # Get more details about the existing customer
                existing_name = existing_client.full_name or f"{existing_client.first_name or ''} {existing_client.last_name or ''}".strip()
                existing_phone = existing_client.phone or "No phone"
                existing_status = existing_client.get_status_display()
                
                # Suggest alternative emails
                base_email = value.split('@')[0]
                domain = value.split('@')[1] if '@' in value else ''
                suggestions = []
                
                if domain:
                    suggestions = [
                        f"{base_email}1@{domain}",
                        f"{base_email}2@{domain}",
                        f"{base_email}_new@{domain}",
                        f"{base_email}2024@{domain}"
                    ]
                
                suggestion_text = ""
                if suggestions:
                    suggestion_text = f" Suggested alternatives: {', '.join(suggestions[:2])}"
                
                raise serializers.ValidationError(
                    f"A customer with email '{value}' already exists.{suggestion_text} "
                    f"Existing customer: {existing_name} ({existing_phone}) - Status: {existing_status}. "
                    "Please use a different email address or update the existing customer."
                )
        
        print(f"Email validation passed: '{value}' is unique for tenant {tenant}")
        return value
    
    class Meta:
        model = Client
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone', 'customer_type', 'status',
            'address', 'city', 'state', 'country', 'postal_code',
            'date_of_birth', 'anniversary_date', 'preferred_metal', 'preferred_stone',
            'ring_size', 'budget_range', 'lead_source', 'notes', 'community',
            'mother_tongue', 'reason_for_visit', 'age_of_end_user', 'next_follow_up', 'summary_notes',
            'created_at', 'updated_at',
            # Frontend field mappings
            'name', 'leadSource', 'reasonForVisit', 'ageOfEndUser', 'source', 
            'nextFollowUp', 'summaryNotes', 'assigned_to',
            'tags', 'tag_slugs',
            'catchment_area', 'next_follow_up_time', 'saving_scheme',
            # Store field for store-based visibility
            'store',
            # User who created the customer
            'created_by',
            # Customer interests
            'customer_interests', 'customer_interests_display', 'customer_interests_input',
            # Soft delete fields
            'is_deleted', 'deleted_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'tags', 'is_deleted', 'deleted_at', 'created_by']
    
    def create(self, validated_data):
        print("=== BACKEND SERIALIZER - CREATE METHOD START ===")
        print(f"Initial validated_data: {validated_data}")
        
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
        if 'customer_interests_input' in validated_data:
            print(f"Customer interests found: {validated_data['customer_interests_input']}")
            # Store the interests for later processing after client creation
            customer_interests_data = validated_data.pop('customer_interests_input')
            print(f"Stored customer interests for later processing: {customer_interests_data}")
        elif 'customer_interests' in validated_data:
            print(f"Customer interests found (legacy field): {validated_data['customer_interests']}")
            customer_interests_data = validated_data.pop('customer_interests')
            print(f"Stored customer interests for later processing: {customer_interests_data}")
        else:
            customer_interests_data = []
        
        # Also check for interests field (frontend might send it differently)
        if 'interests' in validated_data:
            print(f"Interests field found: {validated_data['interests']}")
            customer_interests_data = validated_data.pop('interests')
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
                # Try to find user by username or ID
                try:
                    from apps.users.models import User
                    if assigned_to_value.isdigit():
                        user = User.objects.get(id=int(assigned_to_value))
                    else:
                        user = User.objects.get(username=assigned_to_value)
                    validated_data['assigned_to'] = user
                    print(f"Assigned customer to user: {user}")
                except User.DoesNotExist:
                    validated_data.pop('assigned_to')
                    print(f"User '{assigned_to_value}' not found, removed assigned_to field")
        
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
            
            # ALWAYS assign created_by in create method
            validated_data['created_by'] = request.user
            print(f"Assigned created_by in create: {request.user}")
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
        
        print(f"Final validated data before save: {validated_data}")
        
        try:
            result = super().create(validated_data)
            print(f"=== BACKEND SERIALIZER - CREATE SUCCESS ===")
            print(f"Created client: {result}")
            
            # Process customer interests after client creation
            if customer_interests_data:
                print(f"=== PROCESSING CUSTOMER INTERESTS ===")
                print(f"Processing {len(customer_interests_data)} customer interests for client {result.id}")
                print(f"Raw customer_interests_data: {customer_interests_data}")
                print(f"Type of customer_interests_data: {type(customer_interests_data)}")
                print(f"Length of customer_interests_data: {len(customer_interests_data)}")
                
                # Ensure we have a list
                if not isinstance(customer_interests_data, list):
                    print(f"⚠️ customer_interests_data is not a list: {type(customer_interests_data)}")
                    customer_interests_data = [customer_interests_data] if customer_interests_data else []
                
                from .models import CustomerInterest
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
                                print(f"Product info type: {type(product_name)}, revenue type: {type(revenue)}")
                                
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
                                                    print(f"✅ Found category by ID: {category_obj}")
                                                except Category.DoesNotExist:
                                                    print(f"⚠️ Category ID {category} not found, will create by name")
                                                    category_obj = None
                                            
                                            if not category_obj:
                                                # Try to find by name (case-insensitive)
                                                category_obj = Category.objects.filter(
                                                    name__iexact=category,
                                                    tenant=result.tenant
                                                ).first()
                                                if category_obj:
                                                    print(f"✅ Found category by name: {category_obj}")
                                            
                                            if not category_obj:
                                                print(f"⚠️ Category '{category}' not found for tenant {result.tenant}, creating it")
                                                try:
                                                    category_obj = Category.objects.create(
                                                        name=category,
                                                        tenant=result.tenant,
                                                        scope='store' if result.store else 'global'
                                                    )
                                                    print(f"✅ Created new category: {category_obj}")
                                                except Exception as cat_error:
                                                    print(f"❌ Error creating category '{category}': {cat_error}")
                                                    import traceback
                                                    print(f"Category creation traceback: {traceback.format_exc()}")
                                                    # Try to find any existing category as fallback
                                                    category_obj = Category.objects.filter(tenant=result.tenant).first()
                                                    if not category_obj:
                                                        print(f"❌ No fallback category available, skipping this interest")
                                                        continue
                                                    print(f"⚠️ Using fallback category: {category_obj}")
                                            
                                            # Handle product - could be ID or name
                                            product_obj = None
                                            if str(product_name).isdigit():
                                                # It's an ID, try to find by ID
                                                try:
                                                    product_obj = Product.objects.get(
                                                        id=int(product_name),
                                                        tenant=result.tenant
                                                    )
                                                    print(f"✅ Found product by ID: {product_obj}")
                                                except Product.DoesNotExist:
                                                    print(f"⚠️ Product ID {product_name} not found, will create by name")
                                                    product_obj = None
                                            
                                            if not product_obj:
                                                # Try to find by name (case-insensitive)
                                                product_obj = Product.objects.filter(
                                                    name__iexact=product_name,
                                                    tenant=result.tenant
                                                ).first()
                                                if product_obj:
                                                    print(f"✅ Found product by name: {product_obj}")
                                            
                                            if not product_obj:
                                                print(f"⚠️ Product '{product_name}' not found for tenant {result.tenant}, creating it")
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
                                                    print(f"✅ Created new product: {product_obj}")
                                                except Exception as prod_error:
                                                    print(f"❌ Error creating product '{product_name}': {prod_error}")
                                                    import traceback
                                                    print(f"Product creation traceback: {traceback.format_exc()}")
                                                    # Try to find any existing product as fallback
                                                    product_obj = Product.objects.filter(tenant=result.tenant).first()
                                                    if not product_obj:
                                                        print(f"❌ No fallback product available, skipping this interest")
                                                        continue
                                                    print(f"⚠️ Using fallback product: {product_obj}")
                                            
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
                                                    print(f"✅ Successfully created new customer interest: {interest}")
                                                    print(f"  - ID: {interest.id}")
                                                    print(f"  - Client: {interest.client.full_name}")
                                                    print(f"  - Category: {interest.category.name if interest.category else 'No Category'}")
                                                    print(f"  - Product: {interest.product.name if interest.product else 'No Product'}")
                                                    print(f"  - Revenue: {interest.revenue}")
                                                else:
                                                    print(f"ℹ️ Customer interest already exists: {interest}")
                                            except Exception as interest_error:
                                                print(f"❌ Error creating customer interest: {interest_error}")
                                                import traceback
                                                print(f"CustomerInterest creation traceback: {traceback.format_exc()}")
                                                continue
                                        except Exception as e:
                                            print(f"❌ Error in main processing: {e}")
                                            import traceback
                                            print(f"Main processing traceback: {traceback.format_exc()}")
                                            continue
                                    except (ValueError, TypeError) as e:
                                        print(f"Invalid revenue value '{revenue}' for product '{product_name}': {e}")
                                    except Exception as e:
                                        print(f"❌ Error creating CustomerInterest: {e}")
                                        import traceback
                                        print(f"Traceback: {traceback.format_exc()}")
                                        continue
                                else:
                                    print(f"❌ Skipping product with missing name or revenue: {product_info}")
                                    print(f"  - product_name: '{product_name}' (truthy: {bool(product_name)})")
                                    print(f"  - revenue: '{revenue}' (truthy: {bool(revenue)})")
                        else:
                            print(f"❌ Skipping interest with missing category or products: {interest_data}")
                            print(f"  - category: '{category}' (truthy: {bool(category)})")
                            print(f"  - products: {products} (length: {len(products) if products else 0})")
                    except Exception as e:
                        print(f"❌ Error processing customer interest {interest_data}: {e}")
                        import traceback
                        print(f"Traceback: {traceback.format_exc()}")
                        continue
            else:
                print(f"=== NO CUSTOMER INTERESTS TO PROCESS ===")
                print(f"customer_interests_data is empty or None: {customer_interests_data}")
            
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
    
    def get_customer_interests(self, obj):
        """Return customer interests in a structured format"""
        print(f"=== DEBUG: get_customer_interests called for client {obj.id} ===")
        print(f"Client: {obj.first_name} {obj.last_name}")
        print(f"Client type: {type(obj)}")
        print(f"Client model: {obj._meta.model}")
        
        try:
            interests = obj.interests.all()
            print(f"Found {interests.count()} interests")
            print(f"Interests queryset: {interests}")
            
            if not interests:
                print("No interests found, returning empty list")
                return []
            
            interest_list = []
            for interest in interests:
                print(f"Processing interest: {interest}")
                print(f"  - Interest type: {type(interest)}")
                print(f"  - Interest model: {interest._meta.model}")
                print(f"  - Category: {interest.category}")
                print(f"  - Product: {interest.product}")
                print(f"  - Revenue: {interest.revenue}")
                
                interest_data = {
                    'id': interest.id,
                    'category': {
                        'id': interest.category.id,
                        'name': interest.category.name
                    } if interest.category else None,
                    'product': {
                        'id': interest.product.id,
                        'name': interest.product.name
                    } if interest.product else None,
                    'revenue': float(interest.revenue) if interest.revenue else 0,
                    'notes': interest.notes
                }
                interest_list.append(interest_data)
                print(f"  - Processed interest data: {interest_data}")
            
            print(f"Returning {len(interest_list)} interests: {interest_list}")
            return interest_list
            
        except Exception as e:
            print(f"ERROR in get_customer_interests: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return []

    def update(self, instance, validated_data):
        """Override update method to handle tag updates and customer interests"""
        print(f"=== CLIENT SERIALIZER UPDATE METHOD ===")
        print(f"Instance: {instance}")
        print(f"Validated data: {validated_data}")
        
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
            print(f"✅ Set audit log user: {user}")
        else:
            print(f"⚠️ No user context available for audit log")
        
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
                print(f"⚠️ customer_interests_data is not a list: {type(customer_interests_data)}")
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
                                            print(f"✅ Found category by ID: {category_obj}")
                                        except Category.DoesNotExist:
                                            print(f"⚠️ Category ID {category} not found, will create by name")
                                            category_obj = None
                                    
                                    if not category_obj:
                                        # Try to find by name (case-insensitive)
                                        category_obj = Category.objects.filter(
                                            name__iexact=category,
                                            tenant=result.tenant
                                        ).first()
                                        if category_obj:
                                            print(f"✅ Found category by name: {category_obj}")
                                    
                                    if not category_obj:
                                        print(f"⚠️ Category '{category}' not found for tenant {result.tenant}, creating it")
                                        try:
                                            category_obj = Category.objects.create(
                                                name=category,
                                                tenant=result.tenant,
                                                scope='store' if result.store else 'global'
                                            )
                                            print(f"✅ Created new category: {category_obj}")
                                        except Exception as cat_error:
                                            print(f"❌ Error creating category '{category}': {cat_error}")
                                            # Try to find any existing category as fallback
                                            category_obj = Category.objects.filter(tenant=result.tenant).first()
                                            if not category_obj:
                                                print(f"❌ No fallback category available, skipping this interest")
                                                continue
                                            print(f"⚠️ Using fallback category: {category_obj}")
                                    
                                    # Handle product - could be ID or name
                                    product_obj = None
                                    if str(product_name).isdigit():
                                        # It's an ID, try to find by ID
                                        try:
                                            product_obj = Product.objects.get(
                                                id=int(product_name),
                                                tenant=result.tenant
                                            )
                                            print(f"✅ Found product by ID: {product_obj}")
                                        except Product.DoesNotExist:
                                            print(f"⚠️ Product ID {product_name} not found, will create by name")
                                            product_obj = None
                                    
                                    if not product_obj:
                                        # Try to find by name (case-insensitive)
                                        product_obj = Product.objects.filter(
                                            name__iexact=product_name,
                                            tenant=result.tenant
                                        ).first()
                                        if product_obj:
                                            print(f"✅ Found product by name: {product_obj}")
                                    
                                    if not product_obj:
                                        print(f"⚠️ Product '{product_name}' not found for tenant {result.tenant}, creating it")
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
                                            print(f"✅ Created new product: {product_obj}")
                                        except Exception as prod_error:
                                            print(f"❌ Error creating product '{product_name}': {prod_error}")
                                            # Try to find any existing product as fallback
                                            product_obj = Product.objects.filter(tenant=result.tenant).first()
                                            if not product_obj:
                                                print(f"❌ No fallback product available, skipping this interest")
                                                continue
                                            print(f"⚠️ Using fallback product: {product_obj}")
                                    
                                    # Create the customer interest
                                    try:
                                        # Check if this interest already exists to avoid duplicates
                                        new_interest_identifier = f"{category_obj.name}_{product_obj.name}_{revenue_value}"
                                        if new_interest_identifier in existing_identifiers:
                                            print(f"⚠️ Interest already exists, skipping: {category_obj.name} - {product_obj.name} (₹{revenue_value})")
                                            continue
                                        
                                        interest = CustomerInterest.objects.create(
                                            client=result,
                                            category=category_obj,
                                            product=product_obj,
                                            revenue=revenue_value,
                                            tenant=result.tenant,
                                            notes=notes
                                        )
                                        new_interests_created += 1
                                        print(f"✅ Successfully created customer interest: {interest}")
                                        print(f"  - ID: {interest.id}")
                                        print(f"  - Client: {interest.client.full_name}")
                                        print(f"  - Category: {interest.category.name if interest.category else 'No Category'}")
                                        print(f"  - Product: {interest.product.name if interest.product else 'No Product'}")
                                        print(f"  - Revenue: {interest.revenue}")
                                    except Exception as interest_error:
                                        print(f"❌ Error creating customer interest: {interest_error}")
                                        continue
                                except Exception as e:
                                    print(f"❌ Error processing product: {e}")
                                    continue
                        else:
                            print(f"❌ Skipping interest with missing category or products: {interest_data}")
                except Exception as e:
                    print(f"❌ Error processing customer interest {interest_data}: {e}")
                    continue
            
            # Log summary of interest processing
            final_interests = CustomerInterest.objects.filter(client=result)
            print(f"🎯 Interest processing complete:")
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
        # tags already included by get_tags
        return data
    
    def to_internal_value(self, data):
        """
        Override to handle tenant field before validation.
        """
        print(f"=== TO_INTERNAL_VALUE START ===")
        print(f"Input data: {data}")
        
        # Remove tenant field from data if it exists
        if 'tenant' in data:
            data.pop('tenant')
            print("Removed tenant field from input data")
        
        # Call parent method
        result = super().to_internal_value(data)
        print(f"=== TO_INTERNAL_VALUE RESULT ===")
        print(f"Result: {result}")
        return result
    
    def validate(self, data):
        """
        Custom validation for the entire data set.
        """
        print(f"=== VALIDATING ENTIRE DATA SET ===")
        print(f"Data to validate: {data}")
        
        # For updates, we don't need to validate required fields if they're not being updated
        # Only validate if this is a create operation or if the fields are being updated
        instance = getattr(self, 'instance', None)
        
        if instance is None:
            # This is a create operation
            errors = {}
            
            # Check if we have required fields
            if not data.get('email'):
                errors['email'] = "Email is required"
            
            # Check if we have name or first_name/last_name
            if not data.get('name') and not (data.get('first_name') or data.get('last_name')):
                errors['name'] = "Name is required"
            
            if errors:
                print(f"=== VALIDATION ERRORS: {errors} ===")
                raise serializers.ValidationError(errors)
        else:
            # This is an update operation
            print("=== UPDATE OPERATION - SKIPPING REQUIRED FIELD VALIDATION ===")
        
        print("=== VALIDATION PASSED ===")
        print(f"Final data after validation: {data}")
        return data


class ClientInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientInteraction
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
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