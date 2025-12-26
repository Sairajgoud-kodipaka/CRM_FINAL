"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ComboboxSelect } from "@/components/ui/combobox-select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiService, Client } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { PhoneInputComponent } from "@/components/ui/phone-input";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import {
  INDIAN_CITIES,
  INDIAN_STATES,
  INDIAN_CATCHMENT_AREAS,
  REASONS_FOR_VISIT,
  LEAD_SOURCES,
  SAVING_SCHEMES,
  CUSTOMER_INTERESTS,
  PIPELINE_STAGES,
  CUSTOMER_TYPES,
  AGE_RANGES,
  getStateFromCity,
  getCatchmentAreasForCity,
  getPincodeFromCatchment,
  lockField,
  unlockField,
  isFieldLocked,
} from "@/constants/indian-data";
import { uploadImageToCloudinary, isAllowedImageFile } from "@/lib/cloudinary-upload";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface EditCustomerModalProps {
  open: boolean;
  onClose: () => void;
  customer: Client | null;
  onCustomerUpdated: (updatedCustomer: Client) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate: string;
  anniversaryDate: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  catchmentArea: string;
  pincode: string;
  salesPerson: string;
  reasonForVisit: string;
  customerStatus: string;
  leadSource: string;
  savingScheme: string;
  customerInterests: string[];
  productType: string;
  style: string;
  selectedWeight: number;
  weightUnit: string;
  customerPreference: string;
  designNumber: string;
  summaryNotes: string;
  pipelineStage: string;
  customerType: string;
  ageOfEndUser: string;
  productSubtype: string;
  ageingPercentage: string;
  materialType: string;
  materialWeight: number;
  materialValue: number;
  materialUnit: string;
}

interface ProductInterest {
  mainCategory: string;
  products: { product: string; revenue: string }[];
  preferences: {
    designSelected: boolean;
    wantsDiscount: boolean;
    checkingOthers: boolean;
    lessVariety: boolean;
    purchased: boolean;
    other: string;
  };
}

interface SummaryImageReference {
  url?: string;
  thumb?: string;
}

const createInitialFormData = (): FormData => ({
  firstName: "",
  lastName: "",
    phone: "",
  email: "",
  birthDate: "",
  anniversaryDate: "",
  streetAddress: "",
    city: "",
    state: "",
    country: "India",
  catchmentArea: "",
    pincode: "",
  salesPerson: "",
  reasonForVisit: "",
  customerStatus: "",
  leadSource: "",
  savingScheme: "Inactive",
  customerInterests: [],
  productType: "",
    style: "",
  selectedWeight: 3.5,
  weightUnit: "g",
  customerPreference: "",
  designNumber: "",
  summaryNotes: "",
  pipelineStage: "interested",
  customerType: "individual",
  ageOfEndUser: "",
  productSubtype: "",
  ageingPercentage: "",
  materialType: "",
  materialWeight: 0,
  materialValue: 0,
  materialUnit: "g",
});

const createEmptyInterest = (): ProductInterest => ({
      mainCategory: "",
      products: [{ product: "", revenue: "" }],
      preferences: {
        designSelected: false,
        wantsDiscount: false,
        checkingOthers: false,
        lessVariety: false,
        purchased: false,
        other: "",
      },
});

const formatDateForInput = (value?: string | null): string => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
};

const formatDateForAPI = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().split("T")[0];
};

const emptyToNull = (value: unknown) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return value as number | boolean | null;
};

const parseSummaryNotes = (notes?: string): { text: string; images: SummaryImageReference[] } => {
  if (!notes) {
    return { text: "", images: [] };
  }

  const lines = notes.split(/\n/);
  const textLines: string[] = [];
  const images: SummaryImageReference[] = [];
  let lastImage: SummaryImageReference | null = null;

  for (const line of lines) {
    const imageMatch = line.match(/^\s*\[image\]:\s*(https?:\S+)/i);
    if (imageMatch) {
      lastImage = { url: imageMatch[1] };
      images.push(lastImage);
      continue;
    }

    const thumbMatch = line.match(/^\s*\[thumb\]:\s*(https?:\S+)/i);
    if (thumbMatch) {
      if (lastImage && !lastImage.thumb) {
        lastImage.thumb = thumbMatch[1];
      } else {
        images.push({ thumb: thumbMatch[1] });
      }
      continue;
    }

    textLines.push(line);
    lastImage = null;
  }

  return {
    text: textLines.join("\n").trim(),
    images: images.filter((image) => image.url || image.thumb),
  };
};

const buildSummaryNotes = (
  baseNotes: string,
  existingImages: SummaryImageReference[],
  newImage?: { url: string; thumbUrl: string } | null
): string | null => {
  const trimmedBase = baseNotes.trim();
  const imageLines: string[] = [];
  const allImages: SummaryImageReference[] = [...existingImages];

  if (newImage) {
    allImages.push({ url: newImage.url, thumb: newImage.thumbUrl });
  }

  allImages.forEach((image) => {
    if (image.url) {
      imageLines.push(`[image]: ${image.url}`);
    }
    if (image.thumb) {
      imageLines.push(`[thumb]: ${image.thumb}`);
    }
  });

  const combined = [trimmedBase, ...imageLines].filter(Boolean).join("\n");
  return combined.trim().length ? combined : null;
};

const normalizeInterestsForSubmit = (interests: ProductInterest[]): string[] =>
  interests
    .map((interest) => {
      const normalizedProducts = (interest.products || []).map((product) => ({
        product: product.product,
        revenue: String(parseFloat(product.revenue || "0") || 0),
      }));

      return {
        category: interest.mainCategory,
        products: normalizedProducts,
        preferences: interest.preferences || {},
      };
    })
    .filter((interest) => Array.isArray(interest.products) && interest.products.length > 0)
    .map((interest) => JSON.stringify(interest));

const mapCustomerToInterests = (customer: Client): ProductInterest[] => {
  const raw = (customer as any).customer_interests;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [];
  }

  // Group interests by category to match the frontend structure
  // The frontend expects: { mainCategory, products: [{ product, revenue }], preferences }
  // The backend returns: [{ category: {id, name}, product: {id, name}, revenue, preferences }]
  
  const categoryMap = new Map<string, ProductInterest>();
  
  raw.forEach((entry: any) => {
    // Handle both string (legacy) and object formats
    let parsed = entry;
    if (typeof entry === "string") {
      try {
        parsed = JSON.parse(entry);
      } catch {
        parsed = {};
      }
    }

    // Extract category - can be object {id, name} or string
    // We need to convert to category name for the frontend
    let categoryName = "";
    if (parsed.category) {
      if (typeof parsed.category === "object" && parsed.category.name) {
        categoryName = parsed.category.name;
      } else if (typeof parsed.category === "object" && parsed.category.id) {
        // If we only have ID, try to find the category name
        // This will be handled by the component when categories are loaded
        categoryName = String(parsed.category.id);
      } else if (typeof parsed.category === "string") {
        categoryName = parsed.category;
      } else {
        categoryName = parsed.mainCategory || "";
      }
    } else {
      categoryName = parsed.mainCategory || "";
    }

    // Extract product - backend returns single product object {id, name}
    let productId = "";
    let revenue = 0;
    
    if (parsed.product) {
      if (typeof parsed.product === "object" && parsed.product.id) {
        productId = String(parsed.product.id);
      } else if (typeof parsed.product === "string") {
        productId = parsed.product;
      }
    }
    
    // Revenue can be a number or string
    if (parsed.revenue !== undefined && parsed.revenue !== null) {
      revenue = typeof parsed.revenue === "number" ? parsed.revenue : parseFloat(String(parsed.revenue)) || 0;
    }

    // Extract preferences
    const preferences = parsed.preferences || {};

    // Group by category - if category already exists, add product to it
    // Note: We use the preferences from the first entry in each category group
    if (categoryName && productId) {
      if (categoryMap.has(categoryName)) {
        const existing = categoryMap.get(categoryName)!;
        // Add product to existing category
        existing.products.push({
          product: productId,
          revenue: String(revenue),
        });
        // Merge preferences (OR logic for booleans, keep first "other" text)
        // This ensures all preferences are captured
        existing.preferences = {
          designSelected: existing.preferences.designSelected || Boolean(preferences.designSelected),
          wantsDiscount: existing.preferences.wantsDiscount || Boolean(preferences.wantsDiscount),
          checkingOthers: existing.preferences.checkingOthers || Boolean(preferences.checkingOthers),
          lessVariety: existing.preferences.lessVariety || Boolean(preferences.lessVariety),
          purchased: existing.preferences.purchased || Boolean(preferences.purchased),
          other: existing.preferences.other || preferences.other || "",
        };
      } else {
        // Create new category entry
        categoryMap.set(categoryName, {
          mainCategory: categoryName,
          products: [{
            product: productId,
            revenue: String(revenue),
          }],
          preferences: {
            designSelected: Boolean(preferences.designSelected),
            wantsDiscount: Boolean(preferences.wantsDiscount),
            checkingOthers: Boolean(preferences.checkingOthers),
            lessVariety: Boolean(preferences.lessVariety),
            purchased: Boolean(preferences.purchased),
            other: preferences.other || "",
          },
        });
      }
    }
  });

  // Convert map to array
  const result = Array.from(categoryMap.values());
  
  // If no interests were mapped, return empty array (will show empty interest form)
  return result.length > 0 ? result : [];
};

const mapCustomerToFormData = (customer: Client): FormData => ({
  firstName: customer.first_name || "",
  lastName: customer.last_name || "",
        phone: customer.phone || "",
  email: customer.email || "",
  birthDate: formatDateForInput(customer.date_of_birth),
  anniversaryDate: formatDateForInput(customer.anniversary_date),
  streetAddress: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        country: customer.country || "India",
  catchmentArea: customer.catchment_area || "",
        pincode: customer.pincode || "",
  salesPerson: customer.sales_person || "",
  reasonForVisit: customer.reason_for_visit || "",
  customerStatus: customer.customer_status || customer.status || "",
  leadSource: customer.lead_source || "",
  savingScheme: customer.saving_scheme || "Inactive",
  customerInterests: Array.isArray((customer as any).customer_interests_simple)
    ? ((customer as any).customer_interests_simple as string[])
    : [],
  productType: customer.product_type || "",
        style: customer.style || "",
  selectedWeight:
    typeof customer.material_weight === "number" && customer.material_weight > 0
      ? customer.material_weight
      : 3.5,
  weightUnit: (customer as any).material_unit || "g",
  customerPreference: customer.customer_preference || "",
  designNumber: customer.design_number || "",
  summaryNotes: parseSummaryNotes(customer.summary_notes).text,
  pipelineStage: (customer as any).pipeline_stage || "interested",
  customerType: customer.customer_type || "individual",
  ageOfEndUser: customer.age_of_end_user || "",
  productSubtype: customer.product_subtype || "",
  ageingPercentage: (customer as any).ageing_percentage || "",
  materialType: customer.material_type || "",
  materialWeight: typeof customer.material_weight === "number" ? customer.material_weight : 0,
  materialValue: typeof customer.material_value === "number" ? customer.material_value : 0,
  materialUnit: (customer as any).material_unit || "g",
});

export function EditCustomerModal({ open, onClose, customer, onCustomerUpdated }: EditCustomerModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const [formData, setFormData] = useState<FormData>(() => createInitialFormData());
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
  const [interests, setInterests] = useState<ProductInterest[]>([createEmptyInterest()]);
  const [salesPersons, setSalesPersons] = useState<string[]>([]);
  const [salesPersonOptions, setSalesPersonOptions] = useState<Array<{ id: number; name: string; username: string }>>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [uploadedImage, setUploadedImage] = useState<{ url: string; thumbUrl: string } | null>(null);
  const [summaryImages, setSummaryImages] = useState<SummaryImageReference[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const focusNext = useCallback(
    (fieldId: string) => {
      if (!isMobile) return;
      const element = document.querySelector<HTMLElement>(`[data-field="${fieldId}"]`);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    [isMobile]
  );

  const initializeFromCustomer = useCallback((client: Client) => {
    const mappedForm = mapCustomerToFormData(client);
    const mappedInterests = mapCustomerToInterests(client);
    const parsedSummary = parseSummaryNotes((client as any).summary_notes);

    setFormData(mappedForm);
    setInterests(mappedInterests.length > 0 ? mappedInterests : [createEmptyInterest()]);
    setSummaryImages(parsedSummary.images);
    setUploadedImage(null);

    setLockedFields(() => {
      let next = new Set<string>();
      if (mappedForm.state) next = lockField("state", next);
      if (mappedForm.catchmentArea) next = lockField("catchmentArea", next);
      if (mappedForm.pincode) next = lockField("pincode", next);
      return next;
    });
  }, []);

  const loadSalesPersonOptions = useCallback(async () => {
    if (!user) return;

    try {
      const response = await apiService.getSalesPersonsForContext();
      if (response?.success && response.data) {
        let options: any[] = [];

        if (Array.isArray(response.data)) {
          options = response.data;
        } else if (response.data && typeof response.data === "object") {
          if (Array.isArray((response.data as any).users)) {
            options = (response.data as any).users;
          } else if (Array.isArray((response.data as any).results)) {
            options = (response.data as any).results;
          }
        }

        const salesRoleUsers = options.filter((person) =>
          ["inhouse_sales", "sales"].includes(person.role)
        );

        const names = salesRoleUsers.map((person: any) => {
          const fullName = `${person.first_name || ""} ${person.last_name || ""}`.trim();
          return fullName || person.username || "Unknown User";
        });

        setSalesPersons(names);
        setSalesPersonOptions(
          salesRoleUsers.map((person: any) => ({
            id: person.id,
            name: `${person.first_name || ""} ${person.last_name || ""}`.trim() || person.username || "Unknown User",
            username: person.username,
          }))
        );
      } else {
        setSalesPersons([]);
      }
    } catch (error) {
      setSalesPersons([]);
    }
  }, [user]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await apiService.getCategories();
      if (response.success && response.data) {
        const data = Array.isArray(response.data)
          ? response.data
          : (response.data as any).results || (response.data as any).data || [];
        setCategories(data);
      }
    } catch (error) {
      setCategories([]);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const response = await apiService.getProducts();
      if (response.success && response.data) {
        const data = Array.isArray(response.data)
          ? response.data
          : (response.data as any).results || (response.data as any).data || [];
        setProducts(data);
      }
    } catch (error) {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadSalesPersonOptions();
      loadCategories();
      loadProducts();
    }
  }, [open, loadSalesPersonOptions, loadCategories, loadProducts]);

  useEffect(() => {
    if (!open) {
      setSummaryImages([]);
      setUploadedImage(null);
    }
  }, [open]);

  useEffect(() => {
    if (customer && open) {
      initializeFromCustomer(customer);
    }
  }, [customer, open, initializeFromCustomer]);

  // Update interests when categories are loaded to convert category IDs to names
  useEffect(() => {
    if (categories.length > 0 && interests.length > 0) {
      setInterests((prev) => {
        const updated = prev.map((interest) => {
          // If mainCategory is a number (ID), try to find the category name
          if (interest.mainCategory && !isNaN(Number(interest.mainCategory))) {
            const categoryId = Number(interest.mainCategory);
            const category = categories.find((c) => c.id === categoryId);
            if (category) {
              return {
                ...interest,
                mainCategory: category.name,
              };
            }
          }
          return interest;
        });
        return updated;
      });
    }
  }, [categories, open]);

  const handleInputChange = (field: keyof FormData, value: string | number | string[] | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCitySelection = (city: string) => {
    const state = getStateFromCity(city);

    setFormData((prev) => ({
      ...prev,
      city,
      state: state || "",
      catchmentArea: "",
      pincode: "",
    }));

    setLockedFields((prev) => {
      let next = new Set(prev);
      next = unlockField("catchmentArea", next);
      next = unlockField("pincode", next);
      next = state ? lockField("state", next) : unlockField("state", next);
      return next;
    });

    focusNext("state");
  };

  const handleCatchmentSelection = (catchmentArea: string) => {
    const pincode = getPincodeFromCatchment(catchmentArea);

    setFormData((prev) => ({
      ...prev,
      catchmentArea,
      pincode: pincode || "",
    }));

    setLockedFields((prev) => {
      let next = new Set(prev);
      if (pincode) {
        next = lockField("pincode", next);
      } else {
        next = unlockField("pincode", next);
      }
      return next;
    });

    focusNext("pincode");
  };

  const handleCustomerInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      customerInterests: prev.customerInterests.includes(interest)
        ? prev.customerInterests.filter((item) => item !== interest)
        : [...prev.customerInterests, interest],
    }));
  };

  const handlePreferenceToggle = (
    index: number,
    preference: keyof ProductInterest["preferences"],
    checked: boolean
  ) => {
    setInterests((prev) => {
      const copy = [...prev];
      copy[index].preferences = {
        ...copy[index].preferences,
        [preference]: checked,
      };
      return copy;
    });
  };

  const handleAddInterest = () => setInterests((prev) => [...prev, createEmptyInterest()]);

  const handleRemoveInterest = (index: number) =>
    setInterests((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev));

  const handleProductChange = (index: number, field: "product" | "revenue", value: string) => {
    setInterests((prev) => {
      const copy = [...prev];
      copy[index].products[0] = {
        ...copy[index].products[0],
        [field]: value,
      };
      return copy;
    });
  };

  const handleUploadImage = async (file: File) => {
    if (!isAllowedImageFile(file)) {
      toast({
        title: "Invalid image",
        description: "Please upload a JPG, PNG, or WebP image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setImageUploading(true);
      const result = await uploadImageToCloudinary(file);
      setUploadedImage(result);
      toast({ title: "Image uploaded", variant: "success" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.message || "Could not upload image.",
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.firstName.trim()) errors.push("First Name is required");
    if (!formData.phone.trim()) errors.push("Phone Number is required");
    if (!formData.city.trim()) errors.push("City is required");
    if (!formData.state.trim()) errors.push("State is required");
    if (!formData.catchmentArea.trim()) errors.push("Catchment Area is required");
    if (!formData.salesPerson.trim()) errors.push("Sales Person is required");
    if (!formData.reasonForVisit.trim()) errors.push("Reason for Visit is required");
    if (!formData.leadSource.trim()) errors.push("Lead Source is required");

    // Allow submission if at least one interest has both category and product
    const hasValidInterest = interests.some(
      (interest) => interest.mainCategory && interest.mainCategory.trim() !== "" && interest.products?.[0]?.product && interest.products[0].product.trim() !== ""
    );
    if (!hasValidInterest && interests.length > 0) {
      errors.push("At least one interest must have both a category and product selected");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleSubmit = async () => {
    if (!customer) return;

    const validation = validateForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join("\n"),
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const selectedSalesPerson = salesPersonOptions.find(
        (option) => option.name === formData.salesPerson
      );

      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email?.trim() || undefined,
        address: emptyToNull(formData.streetAddress),
        city: formData.city,
        state: formData.state,
        country: formData.country || "India",
        catchment_area: formData.catchmentArea,
        pincode: emptyToNull(formData.pincode),
        sales_person: formData.salesPerson,
        sales_person_id: selectedSalesPerson ? selectedSalesPerson.id : undefined,
        reason_for_visit: formData.reasonForVisit,
        customer_status: emptyToNull(formData.customerStatus),
        lead_source: formData.leadSource,
        saving_scheme: formData.savingScheme,
        customer_interests: formData.customerInterests,
        customer_interests_input: normalizeInterestsForSubmit(interests),
        product_type: emptyToNull(formData.productType),
        style: emptyToNull(formData.style),
        customer_preference: emptyToNull(formData.customerPreference),
        design_number: emptyToNull(formData.designNumber),
        product_subtype: emptyToNull(formData.productSubtype),
        selected_weight: formData.selectedWeight,
        weight_unit: formData.weightUnit,
        material_type: emptyToNull(formData.materialType),
        material_weight: formData.materialWeight || null,
        material_value: formData.materialValue || null,
        material_unit: formData.materialUnit,
        date_of_birth: formatDateForAPI(formData.birthDate),
        anniversary_date: formatDateForAPI(formData.anniversaryDate),
        age_of_end_user: emptyToNull(formData.ageOfEndUser),
        ageing_percentage: emptyToNull(formData.ageingPercentage),
        pipeline_stage: formData.pipelineStage,
        customer_type: formData.customerType,
        summary_notes: buildSummaryNotes(formData.summaryNotes, summaryImages, uploadedImage),
      } as Record<string, unknown>;

      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
      );

      const response = await apiService.updateClient(
        customer.id?.toString() || "",
        cleanedPayload
      );

      if (response.success && response.data) {
        toast({ title: "Success", description: "Customer updated successfully", variant: "success" });
        onCustomerUpdated(response.data);
        onClose();
      } else {
        toast({
          title: "Error",
          description: "Failed to update customer. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
              toast({
          title: "Error",
        description: error?.message || "Failed to update customer. Please try again.",
          variant: "destructive",
        });
    } finally {
      setSaving(false);
    }
  };

  const availableCatchments = useMemo(
    () => (formData.city ? getCatchmentAreasForCity(formData.city) : INDIAN_CATCHMENT_AREAS),
    [formData.city]
  );

  if (!customer) {
    return null;
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onClose}
      title="Edit Customer"
      description="Update customer information"
      size={isMobile ? "full" : isTablet ? "lg" : "xl"}
      showCloseButton
      className="bg-white"
      actions={
        <div className={`flex items-center gap-2 ${isMobile ? "flex-wrap" : ""}`}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" /> Saving...
              </span>
            ) : (
              "Update Customer"
            )}
          </Button>
        </div>
      }
    >
        <div className="space-y-6">
        {/* Basic Information */}
        <div className={`border rounded-lg ${isMobile ? "p-3" : "p-4"}`}>
          <div className="font-semibold text-lg mb-4">👤 Basic Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name *</label>
              <Input
                data-field="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <Input
                data-field="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Last name"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <PhoneInputComponent
                value={formData.phone}
                onChange={(value) => handleInputChange("phone", value)}
                placeholder="Enter phone number"
                defaultCountry="IN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age of End User</label>
              <Select
                value={formData.ageOfEndUser}
                onValueChange={(value) => handleInputChange("ageOfEndUser", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Age Range" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className={`border rounded-lg ${isMobile ? "p-3" : "p-4"}`}>
          <div className="font-semibold text-lg mb-4">📍 Address</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Street Address</label>
                <Input
                data-field="streetAddress"
                value={formData.streetAddress}
                onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                placeholder="House number, street, area"
                />
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <ComboboxSelect
                  value={formData.city}
                onValueChange={handleCitySelection}
                options={INDIAN_CITIES}
                placeholder="Select City or type to search"
                customPlaceholder="Type city name"
                hideDropdownWhenEmpty
                />
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">State *</label>
              <ComboboxSelect
                  value={formData.state}
                onValueChange={(value) => {
                  handleInputChange("state", value);
                  focusNext("catchmentArea");
                }}
                options={INDIAN_STATES}
                placeholder={isFieldLocked("state", lockedFields) ? "Auto-filled from City" : "Select State or type"}
                customPlaceholder="Type state name"
                disabled={isFieldLocked("state", lockedFields)}
                commitOnSelect
                />
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">Catchment Area *</label>
              <ComboboxSelect
                value={formData.catchmentArea}
                onValueChange={handleCatchmentSelection}
                options={availableCatchments}
                placeholder={
                  availableCatchments.length > 0
                    ? "Select or type catchment area"
                    : "Select City First"
                }
                customPlaceholder="Type catchment area"
                disabled={!formData.city}
                hideDropdownWhenEmpty
              />
              {!formData.city && (
                <div className="text-xs text-blue-600 mt-1">
                  Select a city to see available catchment areas
                </div>
              )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pincode</label>
              <ComboboxSelect
                  value={formData.pincode}
                onValueChange={(value) => handleInputChange("pincode", value)}
                options={formData.pincode ? [formData.pincode] : []}
                placeholder={
                  isFieldLocked("pincode", lockedFields)
                    ? "Auto-filled from Catchment"
                    : "Enter or select Pincode (optional)"
                }
                customPlaceholder="Type pincode"
                disabled={isFieldLocked("pincode", lockedFields)}
                commitOnSelect
                />
              </div>
            </div>
          </div>

          {/* Sales Information */}
        <div className={`border rounded-lg ${isMobile ? "p-3" : "p-4"}`}>
          <div className="font-semibold text-lg mb-4">💼 Sales Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-medium mb-1">Sales Person *</label>
              <Select
                value={formData.salesPerson}
                onValueChange={(value) => {
                  handleInputChange("salesPerson", value);
                  focusNext("reasonForVisit");
                }}
              >
                <SelectTrigger data-field="salesPerson">
                  <SelectValue placeholder="Select Sales Person" />
                </SelectTrigger>
                <SelectContent>
                  {salesPersons.map((person, index) => (
                    <SelectItem key={`${person}-${index}`} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-1 text-xs text-gray-500">
                {user?.role === "platform_admin"
                  ? "🌐 All salespersons across all tenants"
                  : user?.role === "business_admin"
                  ? "🏢 All salespersons in your tenant"
                  : "👥 All salespersons in your store"}
              </div>
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">Saving Scheme</label>
              <Select
                value={formData.savingScheme}
                onValueChange={(value) => handleInputChange("savingScheme", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Saving Scheme" />
                </SelectTrigger>
                <SelectContent>
                  {SAVING_SCHEMES.map((scheme) => (
                    <SelectItem key={scheme} value={scheme}>
                      {scheme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">Reason for Visit *</label>
              <ComboboxSelect
                value={formData.reasonForVisit}
                onValueChange={(value) => handleInputChange("reasonForVisit", value)}
                options={REASONS_FOR_VISIT}
                placeholder="Select Reason"
                customPlaceholder="Enter custom reason"
                hideDropdownWhenEmpty
                />
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">Lead Source *</label>
              <ComboboxSelect
                value={formData.leadSource}
                onValueChange={(value) => handleInputChange("leadSource", value)}
                options={LEAD_SOURCES}
                placeholder="Select Source"
                customPlaceholder="Enter custom lead source"
                hideDropdownWhenEmpty
                />
              </div>
            </div>
          </div>

        {/* Product Interests */}
        <div className={`border rounded-lg ${isMobile ? "p-3" : "p-4"}`}>
          <div className="font-semibold text-lg mb-4">Product Interests</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Type</label>
              <Input
                value={formData.productType}
                onChange={(e) => handleInputChange("productType", e.target.value)}
                placeholder="Necklace, Ring, ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Style</label>
              <Input
                value={formData.style}
                onChange={(e) => handleInputChange("style", e.target.value)}
                placeholder="Traditional, Contemporary..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customer Preference</label>
              <Input
                value={formData.customerPreference}
                onChange={(e) => handleInputChange("customerPreference", e.target.value)}
                placeholder="Preferred designs or motifs"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Design Number</label>
              <Input
                value={formData.designNumber}
                onChange={(e) => handleInputChange("designNumber", e.target.value)}
                placeholder="Internal reference"
              />
            </div>
          </div>

          <div className="border rounded p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Detailed Interests</div>
              <Button variant="outline" size="sm" onClick={handleAddInterest}>
                + Add Interest
              </Button>
            </div>

            {interests.map((interest, index) => (
              <div key={index} className="border rounded-lg p-4 mb-3 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium">Interest #{index + 1}</h5>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveInterest(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Select
                      value={interest.mainCategory || ''}
                      onValueChange={(value) => {
                        const updated = [...interests];
                        updated[index].mainCategory = value;
                        // Clear product when category changes
                        if (updated[index].products[0]) {
                          updated[index].products[0].product = "";
                        }
                        setInterests(updated);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Product</label>
                    <Select
                      value={interest.products[0]?.product || ""}
                      onValueChange={(value) => {
                        handleProductChange(index, "product", value);
                        // Auto-populate revenue if product is selected
                        const selectedProduct = products.find(p => p.id.toString() === value);
                        if (selectedProduct) {
                          const productPrice = selectedProduct.selling_price || selectedProduct.price || 0;
                          setInterests((prev) => {
                            const copy = [...prev];
                            if (!copy[index].products[0]) {
                              copy[index].products[0] = { product: "", revenue: "" };
                            }
                            copy[index].products[0].revenue = productPrice.toString();
                            return copy;
                          });
                        }
                      }}
                      disabled={!interest.mainCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={interest.mainCategory ? "Select Product" : "Select Category First"} />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter((product) => {
                            // Filter products by selected category
                            if (!interest.mainCategory) return false;
                            // Match by category name or ID
                            const categoryName = product.category_name || product.category?.name || '';
                            const categoryId = product.category_id || product.category?.id;
                            return categoryName === interest.mainCategory || 
                                   (categoryId && categories.find(c => c.id === categoryId)?.name === interest.mainCategory);
                          })
                          .map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - ₹{product.selling_price?.toLocaleString('en-IN') || product.price?.toLocaleString('en-IN') || 'Price N/A'}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {!interest.mainCategory && (
                      <div className="text-xs text-blue-600 mt-1">
                        Please select a category first
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Expected Revenue (₹)</label>
                    <Input
                      value={interest.products[0]?.revenue || ""}
                      onChange={(e) => handleProductChange(index, "revenue", e.target.value)}
                      placeholder="e.g., 50000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Other Preferences</label>
                    <Input
                      value={interest.preferences.other}
                      onChange={(e) => {
                        const updated = [...interests];
                        updated[index].preferences.other = e.target.value;
                        setInterests(updated);
                      }}
                      placeholder="Specific notes for this interest"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={interest.preferences.designSelected}
                      onCheckedChange={(checked) => handlePreferenceToggle(index, "designSelected", Boolean(checked))}
                    />
                    Design Selected
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={interest.preferences.wantsDiscount}
                      onCheckedChange={(checked) => handlePreferenceToggle(index, "wantsDiscount", Boolean(checked))}
                    />
                    Wants Discount
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={interest.preferences.checkingOthers}
                      onCheckedChange={(checked) => handlePreferenceToggle(index, "checkingOthers", Boolean(checked))}
                    />
                    Checking Others
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={interest.preferences.lessVariety}
                      onCheckedChange={(checked) => handlePreferenceToggle(index, "lessVariety", Boolean(checked))}
                    />
                    Less Variety
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={interest.preferences.purchased}
                      onCheckedChange={(checked) => handlePreferenceToggle(index, "purchased", Boolean(checked))}
                    />
                    Purchased
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Pipeline */}
        <div className={`border rounded-lg ${isMobile ? "p-3" : "p-4"}`}>
          <div className="font-semibold text-lg mb-4">🚀 Sales Pipeline</div>
          <div>
            <label className="block text-sm font-medium mb-1">Pipeline Stage</label>
            <Select
              value={formData.pipelineStage}
              onValueChange={(value) => handleInputChange("pipelineStage", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Stage" />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Additional Details */}
        <div className={`border rounded-lg ${isMobile ? "p-3" : "p-4"}`}>
          <div className="font-semibold text-lg mb-4">📝 Additional Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-medium mb-1">Product Subtype</label>
                <Input
                value={formData.productSubtype}
                onChange={(e) => handleInputChange("productSubtype", e.target.value)}
                placeholder="e.g., DI.RING"
              />
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">Ageing Percentage</label>
              <Input
                value={formData.ageingPercentage}
                onChange={(e) => handleInputChange("ageingPercentage", e.target.value)}
                placeholder="e.g., 30%"
              />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Summary Notes</label>
                <Textarea
                value={formData.summaryNotes}
                onChange={(e) => handleInputChange("summaryNotes", e.target.value)}
                placeholder="Key discussion points, customer preferences, next steps..."
                rows={4}
              />
              <div className="mt-3 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => document.getElementById("edit-camera-input")?.click()}
                  className="sm:w-auto w-full"
                >
                  Take Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("edit-gallery-input")?.click()}
                  className="sm:w-auto w-full"
                >
                  Choose from Gallery
                </Button>
                <input
                  id="edit-camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadImage(file);
                    e.currentTarget.value = "";
                  }}
                />
                <input
                  id="edit-gallery-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadImage(file);
                    e.currentTarget.value = "";
                  }}
                />
                {imageUploading && <span className="text-sm text-gray-500">Uploading...</span>}
                {summaryImages.length > 0 && (
                  <div className="flex flex-col gap-2 w-full mt-2">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Existing uploads
                    </span>
                    <div className="flex flex-wrap gap-3">
                    {summaryImages.map((image, index) => {
                      const src = image.thumb || image.url;
                      if (!src) return null;
                      const host = (() => {
                        if (!image.url) return null;
                        try {
                          return new URL(image.url).hostname;
                        } catch {
                          return null;
                        }
                      })();
                      return (
                        <div key={`${image.url || image.thumb || index}`} className="flex flex-col gap-1">
                          <img
                            src={src}
                            alt={`Existing upload ${index + 1}`}
                            className="w-32 h-32 object-cover rounded border shadow-sm pointer-events-none select-none"
                          />
                          {host && (
                            <span className="text-[10px] text-gray-500 break-all max-w-[8rem]">
                              {host}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
                {uploadedImage && (
                  <div className="w-full mt-2">
                    <div className="text-xs text-blue-600 mb-1">New upload (will save on update)</div>
                    <img
                      src={uploadedImage.thumbUrl || uploadedImage.url}
                      alt="New upload preview"
                      className="w-32 h-32 object-cover rounded border shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Interest Tags */}
        <div className={`border rounded-lg ${isMobile ? "p-3" : "p-4"}`}>
          <div className="font-semibold text-lg mb-4">Customer Interest Tags</div>
          <div className="flex flex-wrap gap-2">
            {CUSTOMER_INTERESTS.map((interest) => {
              const isSelected = formData.customerInterests.includes(interest);
              return (
                <Button
                  key={interest}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCustomerInterestToggle(interest)}
                  className={isSelected ? "bg-blue-600" : ""}
                >
                  {interest}
                </Button>
              );
            })}
            </div>
          </div>
        </div>
    </ResponsiveDialog>
  );
}

