"""
Customer Segmentation Service

This service implements automated customer segmentation based on real data rules.
It provides both bucket-based (exclusive) and filter-based (overlapping) segmentation.
"""

from django.db.models import Q, Sum, Count, Max, Min
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Any, Tuple
from .models import Client, CustomerTag
from apps.sales.models import Sale


class CustomerSegmentationService:
    """
    Service for automated customer segmentation based on real data rules.
    """
    
    # Segmentation rules configuration
    SEGMENTATION_RULES = {
        "High-Value Buyer": {
            "constraint": "LifetimeSpend >= 100000",
            "exclusive_group": "Spend",
            "filter_logic": {"field": "total_spent", "operator": ">=", "value": 100000}
        },
        "Mid-Tier Buyer": {
            "constraint": "25000 <= LifetimeSpend < 100000", 
            "exclusive_group": "Spend",
            "filter_logic": {
                "and": [
                    {"field": "total_spent", "operator": ">=", "value": 25000},
                    {"field": "total_spent", "operator": "<", "value": 100000}
                ]
            }
        },
        "Budget Buyer": {
            "constraint": "LifetimeSpend < 25000",
            "exclusive_group": "Spend", 
            "filter_logic": {"field": "total_spent", "operator": "<", "value": 25000}
        },
        "Frequent Buyer": {
            "constraint": "PurchaseCount(6mo) >= 3",
            "exclusive_group": "Behavior",
            "filter_logic": {"field": "purchase_count_6mo", "operator": ">=", "value": 3}
        },
        "At-Risk Customer": {
            "constraint": "LastPurchaseDate <= Today - 365d",
            "exclusive_group": "Behavior",
            "priority_over": ["Frequent Buyer"],
            "filter_logic": {
                "field": "last_purchase_date",
                "operator": "<=",
                "value": "Today-365d"
            }
        },
        "Occasion Shopper": {
            "constraint": "OccasionTag IN [Wedding, Engagement, Festival]",
            "exclusive_group": "Occasion",
            "filter_logic": {
                "field": "reason_for_visit",
                "operator": "IN",
                "value": ["wedding", "engagement", "festival", "gifting"]
            }
        },
        "Diamond Lover": {
            "constraint": "DiamondSpend / TotalSpend >= 0.6",
            "exclusive_group": "Preference",
            "filter_logic": {
                "expression": "(diamond_spend / total_spent) >= 0.6"
            }
        },
        "Gold Investor": {
            "constraint": "GoldSpend / TotalSpend >= 0.6", 
            "exclusive_group": "Preference",
            "filter_logic": {
                "expression": "(gold_spend / total_spent) >= 0.6"
            }
        },
        "Online Buyer": {
            "constraint": "OnlineOrders / TotalOrders >= 0.7",
            "exclusive_group": "Channel",
            "filter_logic": {
                "expression": "(online_orders / total_orders) >= 0.7"
            }
        },
        "Walk-in Buyer": {
            "constraint": "StoreOrders / TotalOrders >= 0.7",
            "exclusive_group": "Channel", 
            "filter_logic": {
                "expression": "(store_orders / total_orders) >= 0.7"
            }
        },
        "New Customer": {
            "constraint": "FirstPurchaseDate >= Today - 90d",
            "exclusive_group": "Behavior",
            "excludes": ["Loyal Patron"],
            "filter_logic": {
                "field": "created_at",
                "operator": ">=",
                "value": "Today-90d"
            }
        },
        "Loyal Patron": {
            "constraint": "CustomerSince <= Today - 3y AND PurchaseCount >= 5",
            "exclusive_group": "Behavior",
            "excludes": ["New Customer"],
            "filter_logic": {
                "and": [
                    {"field": "created_at", "operator": "<=", "value": "Today-3y"},
                    {"field": "total_purchases", "operator": ">=", "value": 5}
                ]
            }
        }
    }
    
    # Constraint rules
    MUTUALLY_EXCLUSIVE_GROUPS = ["Spend", "Channel"]
    PRIORITY_OVERRIDES = {
        "At-Risk Customer": ["Frequent Buyer"]
    }
    EXCLUSIONS = {
        "New Customer": ["Loyal Patron"],
        "Loyal Patron": ["New Customer"]
    }

    def __init__(self, tenant_id: int = None):
        self.tenant_id = tenant_id
        self.today = timezone.now().date()

    def get_customers_with_segmentation_data(self) -> List[Dict[str, Any]]:
        """
        Get all customers with enriched segmentation data.
        """
        # Base queryset with tenant filtering
        queryset = Client.objects.filter(is_deleted=False)
        if self.tenant_id:
            queryset = queryset.filter(tenant_id=self.tenant_id)

        # Annotate with segmentation data
        customers = []
        for customer in queryset.select_related('tenant').prefetch_related('sales', 'tags'):
            # Calculate lifetime spend
            total_spent = customer.total_spent
            total_purchases = customer.total_purchases
            
            # Calculate 6-month purchase count
            six_months_ago = self.today - timedelta(days=180)
            purchase_count_6mo = Sale.objects.filter(
                client=customer,
                status__in=['confirmed', 'processing', 'shipped', 'delivered'],
                payment_status__in=['paid', 'partial'],
                order_date__gte=six_months_ago
            ).count()
            
            # Get last purchase date
            last_purchase = Sale.objects.filter(
                client=customer,
                status__in=['confirmed', 'processing', 'shipped', 'delivered'],
                payment_status__in=['paid', 'partial']
            ).order_by('-order_date').first()
            
            last_purchase_date = last_purchase.order_date.date() if last_purchase else None
            
            # Calculate diamond/gold spend ratios
            diamond_spend = self._calculate_category_spend(customer, 'diamond')
            gold_spend = self._calculate_category_spend(customer, 'gold')
            
            # Calculate channel preferences
            online_orders = Sale.objects.filter(
                client=customer,
                status__in=['confirmed', 'processing', 'shipped', 'delivered']
            ).filter(shipping_method__isnull=False).count()
            
            store_orders = total_purchases - online_orders
            
            # Build customer data
            customer_data = {
                'id': customer.id,
                'name': customer.full_name,
                'email': customer.email,
                'phone': customer.phone,
                'status': customer.status,
                'created_at': customer.created_at,
                'total_spent': float(total_spent),
                'total_purchases': total_purchases,
                'purchase_count_6mo': purchase_count_6mo,
                'last_purchase_date': last_purchase_date,
                'reason_for_visit': customer.reason_for_visit,
                'preferred_metal': customer.preferred_metal,
                'preferred_stone': customer.preferred_stone,
                'lead_source': customer.lead_source,
                'diamond_spend': float(diamond_spend),
                'gold_spend': float(gold_spend),
                'online_orders': online_orders,
                'store_orders': store_orders,
                'total_orders': total_purchases,
                'tags': [tag.slug for tag in customer.tags.all()],
                'segments': []  # Will be populated by segmentation logic
            }
            
            customers.append(customer_data)
        
        return customers

    def _calculate_category_spend(self, customer: Client, category: str) -> Decimal:
        """
        Calculate spend for a specific product category.
        """
        if not category:
            return Decimal('0')
            
        # This is a simplified calculation - in a real implementation,
        # you'd join with product categories
        if category.lower() == 'diamond':
            # Look for diamond-related purchases
            diamond_sales = Sale.objects.filter(
                client=customer,
                status__in=['confirmed', 'processing', 'shipped', 'delivered'],
                payment_status__in=['paid', 'partial']
            ).filter(
                Q(notes__icontains='diamond') |
                Q(items__product__name__icontains='diamond')
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            return diamond_sales
        elif category.lower() == 'gold':
            # Look for gold-related purchases
            gold_sales = Sale.objects.filter(
                client=customer,
                status__in=['confirmed', 'processing', 'shipped', 'delivered'],
                payment_status__in=['paid', 'partial']
            ).filter(
                Q(notes__icontains='gold') |
                Q(items__product__name__icontains='gold')
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            return gold_sales
        
        return Decimal('0')

    def apply_segmentation_rules(self, customers: List[Dict[str, Any]], view_type: str = "buckets") -> List[Dict[str, Any]]:
        """
        Apply segmentation rules to customers.
        
        Args:
            customers: List of customer data dictionaries
            view_type: "buckets" for exclusive segments, "filters" for overlapping
        """
        if view_type == "buckets":
            return self._apply_bucket_segmentation(customers)
        else:
            return self._apply_filter_segmentation(customers)

    def _apply_bucket_segmentation(self, customers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Apply bucket-based segmentation (exclusive categories).
        """
        for customer in customers:
            segments = []
            
            # Apply spend segments (mutually exclusive)
            spend_segment = self._get_spend_segment(customer)
            if spend_segment:
                segments.append(spend_segment)
            
            # Apply channel segments (mutually exclusive)
            channel_segment = self._get_channel_segment(customer)
            if channel_segment:
                segments.append(channel_segment)
            
            # Apply behavioral segments (with priority rules)
            behavioral_segments = self._get_behavioral_segments(customer)
            segments.extend(behavioral_segments)
            
            # Apply preference segments (can overlap)
            preference_segments = self._get_preference_segments(customer)
            segments.extend(preference_segments)
            
            # Apply occasion segments (additive)
            occasion_segments = self._get_occasion_segments(customer)
            segments.extend(occasion_segments)

            # Global segment so UI \"All Customers\" can work without special-casing
            if "All Customers" not in segments:
                segments.append("All Customers")
            
            customer['segments'] = segments
        
        return customers

    def _apply_filter_segmentation(self, customers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Apply filter-based segmentation (overlapping categories).
        """
        for customer in customers:
            segments = []
            
            # Apply all segments without exclusivity rules
            for segment_name, rule in self.SEGMENTATION_RULES.items():
                if self._evaluate_segment_rule(customer, rule):
                    segments.append(segment_name)

            # Global segment for \"All Customers\" views
            if "All Customers" not in segments:
                segments.append("All Customers")
            
            customer['segments'] = segments
        
        return customers

    def _get_spend_segment(self, customer: Dict[str, Any]) -> str:
        """Get spend-based segment."""
        total_spent = customer['total_spent']
        
        if total_spent >= 100000:
            return "High-Value Buyer"
        elif total_spent >= 25000:
            return "Mid-Tier Buyer"
        elif total_spent < 25000:
            return "Budget Buyer"
        
        return None

    def _get_channel_segment(self, customer: Dict[str, Any]) -> str:
        """Get channel-based segment."""
        total_orders = customer['total_orders']
        if total_orders == 0:
            return None
            
        online_ratio = customer['online_orders'] / total_orders
        store_ratio = customer['store_orders'] / total_orders
        
        if online_ratio >= 0.7:
            return "Online Buyer"
        elif store_ratio >= 0.7:
            return "Walk-in Buyer"
        
        return None

    def _get_behavioral_segments(self, customer: Dict[str, Any]) -> List[str]:
        """Get behavioral segments with priority rules."""
        segments = []
        
        # Check for at-risk first (has priority over frequent)
        if self._is_at_risk_customer(customer):
            segments.append("At-Risk Customer")
        elif self._is_frequent_customer(customer):
            segments.append("Frequent Buyer")
        
        # Check for new customer
        if self._is_new_customer(customer):
            segments.append("New Customer")
        elif self._is_loyal_customer(customer):
            segments.append("Loyal Patron")
        
        return segments

    def _get_preference_segments(self, customer: Dict[str, Any]) -> List[str]:
        """Get preference-based segments."""
        segments = []
        
        total_spent = customer['total_spent']
        if total_spent > 0:
            diamond_ratio = customer['diamond_spend'] / total_spent
            gold_ratio = customer['gold_spend'] / total_spent
            
            if diamond_ratio >= 0.6:
                segments.append("Diamond Lover")
            if gold_ratio >= 0.6:
                segments.append("Gold Investor")
        
        return segments

    def _get_occasion_segments(self, customer: Dict[str, Any]) -> List[str]:
        """Get occasion-based segments."""
        segments = []
        
        reason = (customer.get('reason_for_visit') or '').lower()
        if reason in ['wedding', 'engagement', 'festival', 'gifting']:
            segments.append("Occasion Shopper")
        
        return segments

    def _evaluate_segment_rule(self, customer: Dict[str, Any], rule: Dict[str, Any]) -> bool:
        """Evaluate if a customer matches a segment rule."""
        filter_logic = rule.get('filter_logic', {})
        
        if 'expression' in filter_logic:
            return self._evaluate_expression(customer, filter_logic['expression'])
        elif 'field' in filter_logic:
            return self._evaluate_field_condition(customer, filter_logic)
        elif 'and' in filter_logic:
            return all(self._evaluate_field_condition(customer, condition) for condition in filter_logic['and'])
        
        return False

    def _evaluate_field_condition(self, customer: Dict[str, Any], condition: Dict[str, Any]) -> bool:
        """Evaluate a field-based condition."""
        field = condition['field']
        operator = condition['operator']
        value = condition['value']
        
        customer_value = customer.get(field)
        
        if customer_value is None:
            return False
        
        # Handle date comparisons
        if isinstance(value, str) and value.startswith('Today'):
            days_offset = int(value.split('-')[1].replace('d', ''))
            value = self.today - timedelta(days=days_offset)
        
        if operator == '>=':
            return customer_value >= value
        elif operator == '<=':
            return customer_value <= value
        elif operator == '>':
            return customer_value > value
        elif operator == '<':
            return customer_value < value
        elif operator == 'IN':
            return customer_value.lower() in [v.lower() for v in value]
        elif operator == '==':
            return customer_value == value
        
        return False

    def _evaluate_expression(self, customer: Dict[str, Any], expression: str) -> bool:
        """Evaluate a mathematical expression."""
        try:
            # Replace field names with customer values
            expr = expression
            for field in ['diamond_spend', 'gold_spend', 'total_spent', 'online_orders', 'store_orders', 'total_orders']:
                if field in expr:
                    expr = expr.replace(field, str(customer.get(field, 0)))
            
            # Evaluate the expression
            result = eval(expr)
            return bool(result)
        except:
            return False

    def _is_at_risk_customer(self, customer: Dict[str, Any]) -> bool:
        """Check if customer is at-risk."""
        last_purchase = customer.get('last_purchase_date')
        if not last_purchase:
            return True  # No purchases = at risk
        
        days_since_purchase = (self.today - last_purchase).days
        return days_since_purchase >= 365

    def _is_frequent_customer(self, customer: Dict[str, Any]) -> bool:
        """Check if customer is frequent buyer."""
        return customer.get('purchase_count_6mo', 0) >= 3

    def _is_new_customer(self, customer: Dict[str, Any]) -> bool:
        """Check if customer is new."""
        created_at = customer.get('created_at')
        if not created_at:
            return False
        
        days_since_created = (self.today - created_at.date()).days
        return days_since_created <= 90

    def _is_loyal_customer(self, customer: Dict[str, Any]) -> bool:
        """Check if customer is loyal."""
        created_at = customer.get('created_at')
        if not created_at:
            return False
        
        days_since_created = (self.today - created_at.date()).days
        total_purchases = customer.get('total_purchases', 0)
        
        return days_since_created >= 1095 and total_purchases >= 5  # 3 years = 1095 days

    def get_segment_analytics(self, customers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate analytics for segments.
        """
        total_customers = len(customers)
        active_customers = len([c for c in customers if c['status'] in ['vvip', 'vip']])
        
        # Count customers by segment
        segment_counts = {}
        for customer in customers:
            for segment in customer.get('segments', []):
                segment_counts[segment] = segment_counts.get(segment, 0) + 1
        
        # Calculate growth (simplified - would need historical data for real growth)
        segment_growth = {}
        for segment in segment_counts:
            segment_growth[segment] = 0  # Placeholder - would calculate from historical data
        
        # Generate insights
        insights = self._generate_insights(customers, segment_counts)
        
        return {
            'total_customers': total_customers,
            'active_customers': active_customers,
            'segment_counts': segment_counts,
            'segment_growth': segment_growth,
            'insights': insights
        }

    def _generate_insights(self, customers: List[Dict[str, Any]], segment_counts: Dict[str, int]) -> Dict[str, Any]:
        """Generate segmentation insights."""
        total_customers = len(customers)
        
        # Find top growing segment (simplified)
        top_growing = max(segment_counts.items(), key=lambda x: x[1]) if segment_counts else ("High-Value Buyer", 0)
        
        # Calculate conversion opportunity
        leads = len([c for c in customers if c['status'] == 'general'])
        conversion_rate = ((total_customers - leads) / total_customers * 100) if total_customers > 0 else 0
        
        # Find at-risk customers
        at_risk_count = segment_counts.get('At-Risk Customer', 0)
        at_risk_percentage = (at_risk_count / total_customers * 100) if total_customers > 0 else 0
        
        return {
            'top_growing_segment': {
                'name': top_growing[0],
                'count': top_growing[1],
                'growth': 15  # Placeholder
            },
            'conversion_opportunity': {
                'leads': leads,
                'conversion_rate': round(conversion_rate, 1)
            },
            'at_risk_customers': {
                'count': at_risk_count,
                'percentage': round(at_risk_percentage, 1)
            }
        }
