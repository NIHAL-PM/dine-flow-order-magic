import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search,
  Filter,
  ChefHat,
  Star,
  DollarSign,
  Eye,
  EyeOff,
  ArrowLeft
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  dietary: string[];
  preparationTime: number;
  ingredients: string[];
  popularity: number;
}

const MenuManagement = () => {
  const navigate = useNavigate();
  
  // Get menu items from localStorage or use empty array
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('menuItems');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories] = useState(['Appetizers', 'Main Course', 'Beverages', 'Desserts']);
  const [dietaryOptions] = useState(['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Gluten-Free', 'Spicy']);
  
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true,
    dietary: [] as string[],
    preparationTime: 0,
    ingredients: [] as string[],
    ingredientInput: ''
  });

  // Save to localStorage whenever menuItems changes
  const saveMenuItems = (items: MenuItem[]) => {
    setMenuItems(items);
    localStorage.setItem('menuItems', JSON.stringify(items));
    // Also save to a global menu context if needed
    window.dispatchEvent(new CustomEvent('menuUpdated', { detail: items }));
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setItemForm({
      name: '',
      description: '',
      price: 0,
      category: '',
      available: true,
      dietary: [],
      preparationTime: 0,
      ingredients: [],
      ingredientInput: ''
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      dietary: item.dietary,
      preparationTime: item.preparationTime,
      ingredients: item.ingredients,
      ingredientInput: ''
    });
    setShowItemDialog(true);
  };

  const handleSaveItem = () => {
    if (!itemForm.name || !itemForm.category || itemForm.price <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    const newItem: MenuItem = {
      id: editingItem?.id || Date.now().toString(),
      name: itemForm.name,
      description: itemForm.description,
      price: itemForm.price,
      category: itemForm.category,
      available: itemForm.available,
      dietary: itemForm.dietary,
      preparationTime: itemForm.preparationTime,
      ingredients: itemForm.ingredients,
      popularity: editingItem?.popularity || 0
    };

    if (editingItem) {
      const updatedItems = menuItems.map(item => item.id === editingItem.id ? newItem : item);
      saveMenuItems(updatedItems);
      toast.success("Menu item updated successfully");
    } else {
      saveMenuItems([...menuItems, newItem]);
      toast.success("Menu item added successfully");
    }

    setShowItemDialog(false);
    resetForm();
  };

  const deleteItem = (id: string) => {
    const updatedItems = menuItems.filter(item => item.id !== id);
    saveMenuItems(updatedItems);
    toast.success("Menu item deleted");
  };

  const toggleAvailability = (id: string) => {
    const updatedItems = menuItems.map(item => 
      item.id === id ? { ...item, available: !item.available } : item
    );
    saveMenuItems(updatedItems);
    const item = menuItems.find(i => i.id === id);
    toast.success(`${item?.name} marked as ${item?.available ? 'unavailable' : 'available'}`);
  };

  const addIngredient = () => {
    if (itemForm.ingredientInput.trim()) {
      setItemForm(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, prev.ingredientInput.trim()],
        ingredientInput: ''
      }));
    }
  };

  const removeIngredient = (index: number) => {
    setItemForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const toggleDietary = (option: string) => {
    setItemForm(prev => ({
      ...prev,
      dietary: prev.dietary.includes(option)
        ? prev.dietary.filter(d => d !== option)
        : [...prev.dietary, option]
    }));
  };

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 90) return 'text-green-600';
    if (popularity >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="mr-3"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold">Menu Management</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Manage your restaurant menu items</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {menuItems.length} Items
              </Badge>
              <Button onClick={() => setShowItemDialog(true)} className="bg-gradient-to-r from-purple-500 to-pink-500">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        {menuItems.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No menu items yet</h3>
            <p className="text-gray-500 mb-4">Start by adding your first menu item</p>
            <Button onClick={() => setShowItemDialog(true)} className="bg-purple-500 hover:bg-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </div>
        ) : (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Items ({menuItems.length})</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category} ({menuItems.filter(item => item.category === category).length})
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{item.name}</CardTitle>
                        <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-bold text-lg text-green-600">₹{item.price}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleAvailability(item.id)}
                          className={`p-2 ${item.available ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {item.available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        {item.popularity > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className={`h-4 w-4 ${getPopularityColor(item.popularity)}`} />
                            <span className={`text-sm ${getPopularityColor(item.popularity)}`}>
                              {item.popularity}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Prep Time:</span>
                        <span className="font-medium">{item.preparationTime} min</span>
                      </div>
                      
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {item.category}
                        </Badge>
                        <div className="flex flex-wrap gap-1">
                          {item.dietary.map(diet => (
                            <Badge key={diet} variant="secondary" className="text-xs">
                              {diet}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Badge 
                        variant={item.available ? "default" : "secondary"}
                        className={item.available ? "bg-green-500" : "bg-red-500"}
                      >
                        {item.available ? "Available" : "Unavailable"}
                      </Badge>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          onClick={() => openEditDialog(item)}
                          className="flex-1"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Tabs>
        )}

        {filteredItems.length === 0 && menuItems.length > 0 && (
          <div className="text-center py-12">
            <ChefHat className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No items found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={itemForm.name}
                  onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={itemForm.price}
                  onChange={(e) => setItemForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={itemForm.description}
                onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your dish..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={itemForm.category} onValueChange={(value) => setItemForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prepTime">Preparation Time (minutes)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  min="0"
                  value={itemForm.preparationTime}
                  onChange={(e) => setItemForm(prev => ({ ...prev, preparationTime: Number(e.target.value) }))}
                />
              </div>
            </div>
            
            <div>
              <Label className="mb-3 block">Dietary Options</Label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map(option => (
                  <Button
                    key={option}
                    type="button"
                    size="sm"
                    variant={itemForm.dietary.includes(option) ? "default" : "outline"}
                    onClick={() => toggleDietary(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="mb-3 block">Ingredients</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={itemForm.ingredientInput}
                  onChange={(e) => setItemForm(prev => ({ ...prev, ingredientInput: e.target.value }))}
                  placeholder="Add ingredient"
                  onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                />
                <Button type="button" onClick={addIngredient}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {itemForm.ingredients.map((ingredient, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeIngredient(index)}>
                    {ingredient} ×
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={itemForm.available}
                onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, available: checked }))}
              />
              <Label>Available for ordering</Label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSaveItem} className="flex-1">
                {editingItem ? 'Update Item' : 'Add Item'}
              </Button>
              <Button variant="outline" onClick={() => { setShowItemDialog(false); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagement;
