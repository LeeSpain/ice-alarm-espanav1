import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Package, Plus, Pencil, Trash2, Check, AlertCircle, Clock, DollarSign, TrendingUp, Receipt, Smartphone, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, calculateProductMargin, type Product, type ProductInput } from "@/hooks/useProducts";
import { useOperationalCosts, useCreateOperationalCost, useUpdateOperationalCost, useMarkCostPaid, useDeleteOperationalCost, type OperationalCost, type OperationalCostInput } from "@/hooks/useOperationalCosts";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { CostForm } from "@/components/admin/products/CostForm";
import { DeviceStockSection } from "@/components/admin/products/DeviceStockSection";
import { DeviceAlertsPanel } from "@/components/admin/products/DeviceAlertsPanel";
import { DeviceApiKeyConfig } from "@/components/admin/products/DeviceApiKeyConfig";
import { useDeviceRealtime } from "@/hooks/useDeviceRealtime";
import { format } from "date-fns";

export default function ProductsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("products");
  
  // Realtime subscription for device updates
  useDeviceRealtime();
  
  // Products state
  const { data: products, isLoading: productsLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  
  // Costs state
  const { data: costs, isLoading: costsLoading } = useOperationalCosts();
  const createCost = useCreateOperationalCost();
  const updateCost = useUpdateOperationalCost();
  const markPaid = useMarkCostPaid();
  const deleteCost = useDeleteOperationalCost();
  const [costFormOpen, setCostFormOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<OperationalCost | null>(null);
  const [deletingCost, setDeletingCost] = useState<OperationalCost | null>(null);

  // Calculate summary stats
  const totalProducts = products?.length ?? 0;
  const activeProducts = products?.filter(p => p.is_active).length ?? 0;
  const pendingCosts = costs?.filter(c => c.status === "pending" || c.status === "overdue") ?? [];
  const pendingTotal = pendingCosts.reduce((sum, c) => sum + Number(c.amount), 0);
  const overdueCosts = costs?.filter(c => c.status === "overdue").length ?? 0;

  const handleProductSubmit = (data: ProductInput) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, ...data });
    } else {
      createProduct.mutate(data);
    }
    setEditingProduct(null);
  };

  const handleCostSubmit = (data: OperationalCostInput) => {
    if (editingCost) {
      updateCost.mutate({ id: editingCost.id, ...data });
    } else {
      createCost.mutate(data);
    }
    setEditingCost(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "supplier_payment": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "operational": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "marketing": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "staff": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-500"><Check className="w-3 h-3 mr-1" />Paid</Badge>;
      case "overdue":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    switch (frequency) {
      case "monthly": return <Badge variant="outline">Monthly</Badge>;
      case "annual": return <Badge variant="outline">Annual</Badge>;
      default: return <Badge variant="outline">One-time</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {t("admin.products.title", "Products & Costs")}
          </h1>
          <p className="text-muted-foreground">
            {t("admin.products.subtitle", "Manage product pricing, costs, and operational expenses")}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("admin.products.totalProducts", "Total Products")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalProducts}</span>
              <span className="text-sm text-muted-foreground">({activeProducts} active)</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("admin.products.pendingExpenses", "Pending Expenses")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">€{pendingTotal.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("admin.products.overdueCount", "Overdue Payments")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-4 w-4 ${overdueCosts > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              <span className={`text-2xl font-bold ${overdueCosts > 0 ? "text-destructive" : ""}`}>{overdueCosts}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("admin.products.avgMargin", "Avg. Margin")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold text-green-600">
                {products && products.length > 0
                  ? (products.reduce((sum, p) => sum + calculateProductMargin(p).marginPercent, 0) / products.length).toFixed(1)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            {t("admin.products.productsTab", "Products")}
          </TabsTrigger>
          <TabsTrigger value="stock">
            <Smartphone className="w-4 h-4 mr-2" />
            EV-07B Stock
          </TabsTrigger>
          <TabsTrigger value="costs">
            <DollarSign className="w-4 h-4 mr-2" />
            {t("admin.products.costsTab", "Operational Costs")}
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("admin.products.productCatalog", "Product Catalog")}</CardTitle>
                <CardDescription>{t("admin.products.productCatalogDesc", "Manage your products with selling prices and supplier costs")}</CardDescription>
              </div>
              <Button onClick={() => { setEditingProduct(null); setProductFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                {t("admin.products.addProduct", "Add Product")}
              </Button>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.name", "Name")}</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">{t("admin.products.sellingNet", "Selling (Net)")}</TableHead>
                      <TableHead className="text-right">{t("admin.products.sellingFinal", "Selling (Final)")}</TableHead>
                      <TableHead className="text-right">{t("admin.products.costPrice", "Cost")}</TableHead>
                      <TableHead className="text-right">{t("admin.products.margin", "Margin")}</TableHead>
                      <TableHead>{t("common.status", "Status")}</TableHead>
                      <TableHead className="text-right">{t("common.actions", "Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product) => {
                      const { sellingFinal, margin, marginPercent } = calculateProductMargin(product);
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.supplier_name && (
                                <p className="text-xs text-muted-foreground">{product.supplier_name}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.sku || "-"}</TableCell>
                          <TableCell className="text-right">€{Number(product.selling_price_net).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">€{sellingFinal.toFixed(2)}</TableCell>
                          <TableCell className="text-right">€{Number(product.cost_price).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <span className={margin >= 0 ? "text-green-600" : "text-destructive"}>
                              €{margin.toFixed(2)} ({marginPercent.toFixed(1)}%)
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? "default" : "secondary"}>
                              {product.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEditingProduct(product); setProductFormOpen(true); }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingProduct(product)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock" className="mt-4 space-y-6">
          {/* Open Device Alerts */}
          <DeviceAlertsPanel />
          {/* Device Stock Management */}
          <DeviceStockSection />
          {/* API Configuration */}
          <DeviceApiKeyConfig />
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("admin.products.operationalCosts", "Operational Costs")}</CardTitle>
                <CardDescription>{t("admin.products.operationalCostsDesc", "Track recurring and one-time business expenses")}</CardDescription>
              </div>
              <Button onClick={() => { setEditingCost(null); setCostFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                {t("admin.products.addCost", "Add Cost")}
              </Button>
            </CardHeader>
            <CardContent>
              {costsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : costs && costs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.name", "Name")}</TableHead>
                      <TableHead>{t("common.category", "Category")}</TableHead>
                      <TableHead className="text-right">{t("common.amount", "Amount")}</TableHead>
                      <TableHead>{t("admin.products.frequency", "Frequency")}</TableHead>
                      <TableHead>{t("admin.products.dueDate", "Due Date")}</TableHead>
                      <TableHead>{t("common.status", "Status")}</TableHead>
                      <TableHead className="text-right">{t("common.actions", "Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cost.name}</p>
                            {cost.notes && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{cost.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(cost.category)}`}>
                            {cost.category.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">€{Number(cost.amount).toFixed(2)}</TableCell>
                        <TableCell>{getFrequencyBadge(cost.frequency)}</TableCell>
                        <TableCell>
                          {cost.due_date ? format(new Date(cost.due_date), "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(cost.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {cost.status !== "paid" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markPaid.mutate(cost.id)}
                                title="Mark as paid"
                              >
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingCost(cost); setCostFormOpen(true); }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingCost(cost)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t("admin.products.noCosts", "No operational costs added yet")}</p>
                  <Button variant="outline" className="mt-4" onClick={() => setCostFormOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("admin.products.addFirstCost", "Add your first cost")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Form Dialog */}
      <ProductForm
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        product={editingProduct}
        onSubmit={handleProductSubmit}
        isLoading={createProduct.isPending || updateProduct.isPending}
      />

      {/* Cost Form Dialog */}
      <CostForm
        open={costFormOpen}
        onOpenChange={setCostFormOpen}
        cost={editingCost}
        onSubmit={handleCostSubmit}
        isLoading={createCost.isPending || updateCost.isPending}
      />

      {/* Delete Product Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.products.deleteProduct", "Delete Product")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.products.deleteProductConfirm", "Are you sure you want to delete this product? This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingProduct) {
                  deleteProduct.mutate(deletingProduct.id);
                  setDeletingProduct(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Cost Confirmation */}
      <AlertDialog open={!!deletingCost} onOpenChange={() => setDeletingCost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.products.deleteCost", "Delete Cost")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.products.deleteCostConfirm", "Are you sure you want to delete this cost entry? This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCost) {
                  deleteCost.mutate(deletingCost.id);
                  setDeletingCost(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
