"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService } from "@/lib/api-service";
import { useAuth } from "@/hooks/useAuth";
import { User, Package, DollarSign, Search, Filter, Download, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Purchase {
  id: number;
  client: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    store?: {
      id: number;
      name: string;
    };
    created_by?: {
      id: number;
      first_name: string;
      last_name: string;
      username: string;
    };
  };
  product_name: string;
  amount: string;
  purchase_date: string;
  notes?: string;
  created_at: string;
}

interface SalesPipeline {
  id: number;
  title: string;
  client: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    store?: {
      id: number;
      name: string;
    };
    created_by?: {
      id: number;
      first_name: string;
      last_name: string;
      username: string;
    };
  };
  stage: string;
  expected_value: string;
  actual_close_date: string;
  notes?: string;
  created_at: string;
}

export default function BusinessAdminPurchasesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [closedWonDeals, setClosedWonDeals] = useState<SalesPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStore, setFilterStore] = useState("all");
  const [sortBy, setSortBy] = useState("amount");
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    fetchPurchases();
    fetchClosedWonDeals();
    fetchStores();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await apiService.getPurchases();
      console.log("Purchases API response:", response);
      
      // Handle different response formats
      let purchasesData = null;
      
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          // Standard ApiResponse format with direct array
          purchasesData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Paginated response format
          purchasesData = response.data.results;
        }
      } else if (Array.isArray(response)) {
        // Direct array response
        purchasesData = response;
      } else if (response.data && Array.isArray(response.data)) {
        // Response with data property but no success
        purchasesData = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        // Paginated response without success property
        purchasesData = response.data.results;
      }
      
      if (purchasesData && Array.isArray(purchasesData)) {
        console.log("Purchases data:", purchasesData);
        setPurchases(purchasesData);
      } else {
        console.error("Invalid purchases response format:", response);
        console.error("Response type:", typeof response);
        console.error("Response keys:", response ? Object.keys(response) : 'No response');
        setPurchases([]);
        toast({
          title: "Warning",
          description: "Received invalid purchases data format",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setPurchases([]);
      toast({
        title: "Error",
        description: "Failed to fetch purchases",
        variant: "destructive",
      });
    }
  };

  const fetchClosedWonDeals = async () => {
    try {
      const response = await apiService.getSalesPipelines();
      console.log("Sales pipelines API response:", response);
      
      // Handle different response formats
      let salesData = null;
      
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          // Standard ApiResponse format with direct array
          salesData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Paginated response format
          salesData = response.data.results;
        }
      } else if (Array.isArray(response)) {
        // Direct array response
        salesData = response;
      } else if (response.data && Array.isArray(response.data)) {
        // Response with data property but no success
        salesData = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        // Paginated response without success property
        salesData = response.data.results;
      }
      
      if (salesData && Array.isArray(salesData)) {
        console.log("Sales pipelines data:", salesData);
        const closedWon = salesData.filter(
          (deal: SalesPipeline) => deal.stage === "closed_won"
        );
        console.log("Closed won deals:", closedWon);
        setClosedWonDeals(closedWon);
      } else {
        console.error("Invalid sales pipelines response format:", response);
        console.error("Response type:", typeof response);
        console.error("Response keys:", response ? Object.keys(response) : 'No response');
        setClosedWonDeals([]);
        toast({
          title: "Warning",
          description: "Received invalid sales pipeline data format",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching closed won deals:", error);
      setClosedWonDeals([]);
      toast({
        title: "Error",
        description: "Failed to fetch sales pipeline data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await apiService.getStores();
      console.log("Stores API response:", response);
      
      let storesData = [];
      
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          storesData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          storesData = response.data.results;
        }
      } else if (Array.isArray(response)) {
        storesData = response;
      } else if (response.data && Array.isArray(response.data)) {
        storesData = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        storesData = response.data.results;
      }
      
      if (Array.isArray(storesData)) {
        console.log("Stores data:", storesData);
        setStores(storesData);
      } else {
        console.error("Invalid stores response format:", response);
        setStores([]);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      setStores([]);
    }
  };



  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(parseFloat(amount));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "closed_won":
        return "default";
      case "closed_lost":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "closed_won":
        return "Closed Won";
      case "closed_lost":
        return "Closed Lost";
      default:
        return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const filteredData = [...(purchases || []), ...(closedWonDeals || [])].filter((item) => {
    // Add null checks for client and full_name
    if (!item.client || !item.client.full_name) {
      return false;
    }

    const matchesSearch = 
      item.client.full_name.toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      (item as any).product_name?.toLowerCase()?.includes((searchTerm || "").toLowerCase()) ||
      (item as SalesPipeline).title?.toLowerCase()?.includes((searchTerm || "").toLowerCase());

    const matchesStore = filterStore === "all" || 
      (item.client.store && item.client.store.id.toString() === filterStore);

    if (filterStatus === "all") return matchesSearch && matchesStore;
    if (filterStatus === "purchases") return "product_name" in item && matchesSearch && matchesStore;
    if (filterStatus === "deals") return "stage" in item && matchesSearch && matchesStore;
    
    return matchesSearch && matchesStore;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "amount") {
      const amountA = parseFloat((a as any).amount || (a as SalesPipeline).expected_value || "0");
      const amountB = parseFloat((b as any).amount || (b as SalesPipeline).expected_value || "0");
      return amountB - amountA;
    }
    if (sortBy === "name") {
      // Add null check for client.full_name
      if (!a.client?.full_name || !b.client?.full_name) {
        return 0;
      }
      return a.client.full_name.localeCompare(b.client.full_name);
    }
    if (sortBy === "store") {
      const storeA = a.client.store?.name || "No Store";
      const storeB = b.client.store?.name || "No Store";
      return storeA.localeCompare(storeB);
    }
    return 0;
  });

  const exportToCSV = () => {
    const headers = ["Customer Name", "Store", "Product/Deal", "Amount", "Created By", "Type"];
    const csvData = sortedData.map((item) => [
      item.client.full_name,
      item.client.store?.name || "No Store",
      "product_name" in item ? item.product_name : (item as SalesPipeline).title,
      "product_name" in item ? item.amount : (item as SalesPipeline).expected_value,
      item.client.created_by ? `${item.client.created_by.first_name} ${item.client.created_by.last_name}` : "N/A",
      "product_name" in item ? "Purchase" : "Closed Deal"
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchases_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchases & Closed Deals</h1>
          <p className="text-gray-600 mt-2">
            View all customer purchases and closed won deals across all stores
          </p>
        </div>
        <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Won Deals</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedWonDeals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set([...purchases, ...closedWonDeals].map(item => item.client.id)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set([...purchases, ...closedWonDeals].map(item => item.client.store?.id).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by customer name, product, or deal title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="purchases">Purchases Only</SelectItem>
                <SelectItem value="deals">Closed Deals Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStore} onValueChange={setFilterStore}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {Array.isArray(stores) && stores.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>

                <SelectItem value="amount">Sort by Amount</SelectItem>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="store">Sort by Store</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchases and Deals List */}
      <div className="space-y-4">
        {sortedData.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No purchases or closed deals found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedData.map((item, index) => (
            <Card key={`${"product_name" in item ? "purchase" : "deal"}-${item.id}`}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.client.full_name}
                      </h3>
                      <Badge variant={getStatusBadgeVariant("product_name" in item ? "purchase" : (item as SalesPipeline).stage)}>
                        {"product_name" in item ? "Purchase" : getStatusDisplay((item as SalesPipeline).stage)}
                      </Badge>
                      {item.client.store && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Store className="w-3 h-3 mr-1" />
                          {item.client.store.name}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Product/Deal:</span>{" "}
                        {"product_name" in item ? item.product_name : (item as SalesPipeline).title}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span>{" "}
                        {formatCurrency(
                          "product_name" in item ? item.amount : (item as SalesPipeline).expected_value
                        )}
                      </div>

                      <div>
                        <span className="font-medium">Created By:</span>{" "}
                        {item.client.created_by ? (
                          `${item.client.created_by.first_name} ${item.client.created_by.last_name}`
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </div>

                    {item.notes && (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {item.notes}
                      </div>
                    )}
                  </div>


                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
