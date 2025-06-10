
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Search, Edit, Trash } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  preparationTime: number; // in minutes
  tags: string[];
}

const MenuManagement = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: '1',
      name: 'Margherita Pizza',
      description: 'Fresh tomatoes, mozzarella cheese, basil leaves on crispy thin crust',
      price: 299,
      category: 'Main Course',
      available: true,
      preparationTime: 15,
      tags: ['Vegetarian', 'Popular']
    },
    {
      id: '2',
      name: 'Chicken Burger',
      description: 'Grilled chicken breast, lettuce, tomato, mayo in sesame bun',
      price: 249,
      category: 'Main Course',
      available: true,
      preparationTime: 12,
      tags: ['Non-Vegetarian']
    },
    {
      id: '3',
      name: 'Caesar Salad',
      description: 'Romaine lettuce, parmesan cheese, croutons with caesar dressing',
      price: 199,
      category: 'Appetizers',
      available: true,
      preparationTime: 8,
      tags: ['Vegetarian', 'Healthy']
    },
    {
      id: '4',
      name: 'Coca Cola',
      description: 'Chilled coca cola - 330ml can',
      price: 49,
      category: 'Beverages',
      available: true,
      preparationTime: 1,
      tags: ['Cold Drink']
    },
    {
      id: '5',
      name: 'Chocolate Cake',
      description: 'Rich chocolate cake with chocolate frosting and chocolate chips',
      price: 149,
      category: 'Desserts',
      available: false,
      preparationTime: 5,
      tags: ['Vegetarian', 'Sweet']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: 'Main Course',
    available: true,
    preparationTime: 10,
    tags: []
  });

  const categories = ['Main Course', 'Appetizers', 'Beverages', 'Desserts'];
  const availableTags = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Spicy', 'Popular', 'Healthy', 'Cold Drink', 'Sweet'];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveItem = () => {
    if (isCreateMode) {
      const newItem: MenuItem = {
        ...formData as MenuItem,
        id: Date.now().toString()
      };
      setMenuItems(prev => [...prev, newItem]);
    } else if (editingItem) {
      setMenuItems(prev => 
        prev.map(item => 
          item.id === editingItem.id ? { ...formData as MenuItem, id: editingItem.id } : item
        )
      );
    }
    resetForm();
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsCreateMode(false);
  };

  const handleCreateNew = () => {
    setIsCreateMode(true);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'Main Course',
      available: true,
      preparationTime: 10,
      tags: []
    });
  };

  const handleDeleteItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
  };

  const toggleItemAvailability = (id: string) => {
    setMenuItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, available: !item.available } : item
      )
    );
  };

  const resetForm = () => {
    setEditingItem(null);
    setIsCreateMode(false);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'Main Course',
      available: true,
      preparationTime: 10,
      tags: []
    });
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...(prev.tags || []), tag]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Menu Management</h1>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={handleCreateNew} className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {isCreateMode ? 'Add New Menu Item' : 'Edit Menu Item'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Item Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter item name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Enter item description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="prepTime">Preparation Time (minutes)</Label>
                      <Input
                        id="prepTime"
                        type="number"
                        value={formData.preparationTime}
                        onChange={(e) => setFormData({...formData, preparationTime: Number(e.target.value)})}
                        placeholder="10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableTags.map(tag => (
                        <Button
                          key={tag}
                          type="button"
                          variant={formData.tags?.includes(tag) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTagToggle(tag)}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="available"
                      checked={formData.available}
                      onCheckedChange={(checked) => setFormData({...formData, available: checked})}
                    />
                    <Label htmlFor="available">Available for ordering</Label>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={resetForm} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveItem} 
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                      disabled={!formData.name || !formData.description || formData.price === 0}
                    >
                      {isCreateMode ? 'Create Item' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
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
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <Card key={item.id} className={`${item.available ? '' : 'opacity-60 bg-gray-50'}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{item.name}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{item.category}</Badge>
                      <Badge variant={item.available ? "default" : "secondary"}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">₹{item.price}</p>
                    <p className="text-sm text-gray-500">{item.preparationTime} min</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleItemAvailability(item.id)}
                    className="flex-1"
                  >
                    {item.available ? 'Mark Unavailable' : 'Mark Available'}
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Menu Item</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Item Name</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="price">Price (₹)</Label>
                            <Input
                              id="price"
                              type="number"
                              value={formData.price}
                              onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={3}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Category</Label>
                            <Select 
                              value={formData.category} 
                              onValueChange={(value) => setFormData({...formData, category: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(category => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="prepTime">Preparation Time (minutes)</Label>
                            <Input
                              id="prepTime"
                              type="number"
                              value={formData.preparationTime}
                              onChange={(e) => setFormData({...formData, preparationTime: Number(e.target.value)})}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Tags</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {availableTags.map(tag => (
                              <Button
                                key={tag}
                                type="button"
                                variant={formData.tags?.includes(tag) ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleTagToggle(tag)}
                              >
                                {tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="available"
                            checked={formData.available}
                            onCheckedChange={(checked) => setFormData({...formData, available: checked})}
                          />
                          <Label htmlFor="available">Available for ordering</Label>
                        </div>
                        
                        <div className="flex gap-2 pt-4">
                          <Button onClick={resetForm} variant="outline" className="flex-1">
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSaveItem} 
                            className="flex-1 bg-orange-500 hover:bg-orange-600"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500">No menu items found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MenuManagement;
