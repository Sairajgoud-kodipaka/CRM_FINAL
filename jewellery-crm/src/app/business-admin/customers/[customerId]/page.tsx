'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout, CardContainer } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  ShoppingBag,
  IndianRupee,
  User,
  Building,
  Clock,
  Plus,
  MessageSquare,
  FileText,
  AlertCircle
} from 'lucide-react';
import { apiService, Client } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';

interface CustomerDetail {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
}

interface Order {
  id: number;
  order_number: string;
  order_date: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items_count: number;
}

interface Appointment {
  id: number;
  date: string;
  time: string;
  purpose: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  assigned_to?: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [customer, setCustomer] = React.useState<CustomerDetail | null>(null);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const customerId = params.customerId as string;

  React.useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch customer details
      const customerResponse = await apiService.getClient(parseInt(customerId));
      if (customerResponse.success && customerResponse.data) {
        setCustomer(customerResponse.data);
      } else {
        setError('Customer not found');
        return;
      }

      // Fetch customer orders (you'll need to implement this in apiService)
      try {
        const ordersResponse = await apiService.getSales();
        if (ordersResponse.success && ordersResponse.data) {
          const customerOrders = Array.isArray(ordersResponse.data) 
            ? ordersResponse.data.filter((order: any) => order.client === parseInt(customerId))
            : [];
          
          const formattedOrders: Order[] = customerOrders.map((order: any) => ({
            id: order.id,
            order_number: `ORD-${order.id}`,
            order_date: order.order_date,
            total_amount: order.total_amount,
            status: order.status || 'confirmed',
            items_count: order.items?.length || 0
          }));
          
          setOrders(formattedOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }

      // Fetch customer appointments
      try {
        const appointmentsResponse = await apiService.getAppointments();
        if (appointmentsResponse.success && appointmentsResponse.data) {
          const customerAppointments = Array.isArray(appointmentsResponse.data)
            ? appointmentsResponse.data.filter((apt: any) => apt.client === parseInt(customerId))
            : [];
          
          const formattedAppointments: Appointment[] = customerAppointments.map((apt: any) => ({
            id: apt.id,
            date: apt.date,
            time: apt.time,
            purpose: apt.purpose,
            status: apt.status,
            assigned_to: apt.assigned_to
          }));
          
          setAppointments(formattedAppointments);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }

    } catch (error) {
      console.error('Error fetching customer data:', error);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/business-admin/customers');
  };

  const handleEdit = () => {
    router.push(`/business-admin/customers/${customerId}/edit`);
  };

  const handleNewOrder = () => {
    router.push(`/business-admin/orders/new?customer=${customerId}`);
  };

  const handleNewAppointment = () => {
    router.push(`/business-admin/appointments/new?customer=${customerId}`);
  };

  const handleContact = () => {
    if (customer?.phone) {
      window.open(`tel:${customer.phone}`);
    }
  };

  const handleEmail = () => {
    if (customer?.email) {
      window.open(`mailto:${customer.email}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <DashboardLayout title="Customer Not Found">
        <CardContainer>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Customer Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The customer you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </Button>
          </div>
        </CardContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`${customer.first_name} ${customer.last_name}`}
      subtitle="Customer Details & History"
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" onClick={handleContact}>
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button variant="outline" onClick={handleEmail}>
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-1">
          <CardContainer>
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="w-16 h-16">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {customer.first_name[0]}{customer.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">
                  {customer.first_name} {customer.last_name}
                </h2>
                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                  {customer.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{customer.email}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{customer.phone}</span>
              </div>

              {customer.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">
                    {customer.address}
                    {customer.city && `, ${customer.city}`}
                    {customer.state && `, ${customer.state}`}
                    {customer.pincode && ` - ${customer.pincode}`}
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Customer since {new Date(customer.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContainer>

          {/* Quick Actions */}
          <CardContainer className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={handleNewOrder}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                New Order
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleNewAppointment}>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Appointment
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </CardContainer>
        </div>

        {/* Customer Activity */}
        <div className="lg:col-span-2">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <CardContainer>
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContainer>

            <CardContainer>
              <div className="flex items-center space-x-3">
                <IndianRupee className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">
                    ₹{(orders.reduce((sum, order) => sum + order.total_amount, 0) / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
            </CardContainer>

            <CardContainer>
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Appointments</p>
                  <p className="text-2xl font-bold">{appointments.length}</p>
                </div>
              </div>
            </CardContainer>
          </div>

          {/* Recent Orders */}
          <CardContainer className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Orders</h3>
              <Button variant="outline" size="sm" onClick={handleNewOrder}>
                <Plus className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </div>
            
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.order_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{order.total_amount}</p>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
                <p className="text-sm">This customer hasn't placed any orders</p>
              </div>
            )}
          </CardContainer>

          {/* Recent Appointments */}
          <CardContainer>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Appointments</h3>
              <Button variant="outline" size="sm" onClick={handleNewAppointment}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            </div>
            
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{appointment.purpose}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{appointment.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No appointments</p>
                <p className="text-sm">This customer hasn't scheduled any appointments</p>
              </div>
            )}
          </CardContainer>
        </div>
      </div>
    </DashboardLayout>
  );
} 