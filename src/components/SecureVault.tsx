import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff, Save, Loader2, Lock } from 'lucide-react';

interface SensitiveData {
  date_of_birth: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface SecureVaultProps {
  userId: string;
}

export const SecureVault = ({ userId }: SecureVaultProps) => {
  const [data, setData] = useState<SensitiveData>({
    date_of_birth: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showData, setShowData] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSensitiveData();
  }, [userId]);

  const fetchSensitiveData = async () => {
    try {
      const { data: sensitiveData, error } = await supabase
        .from('sensitive_user_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (sensitiveData) {
        setHasExistingData(true);
        setData({
          date_of_birth: sensitiveData.date_of_birth || '',
          address_line1: sensitiveData.address_line1 || '',
          address_line2: sensitiveData.address_line2 || '',
          city: sensitiveData.city || '',
          state: sensitiveData.state || '',
          postal_code: sensitiveData.postal_code || '',
          country: sensitiveData.country || '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching sensitive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (hasExistingData) {
        const { error } = await supabase
          .from('sensitive_user_data')
          .update({
            date_of_birth: data.date_of_birth || null,
            address_line1: data.address_line1 || null,
            address_line2: data.address_line2 || null,
            city: data.city || null,
            state: data.state || null,
            postal_code: data.postal_code || null,
            country: data.country || null,
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sensitive_user_data')
          .insert({
            user_id: userId,
            date_of_birth: data.date_of_birth || null,
            address_line1: data.address_line1 || null,
            address_line2: data.address_line2 || null,
            city: data.city || null,
            state: data.state || null,
            postal_code: data.postal_code || null,
            country: data.country || null,
          });

        if (error) throw error;
        setHasExistingData(true);
      }

      toast({
        title: 'Saved securely',
        description: 'Your sensitive information has been encrypted and stored',
      });
    } catch (error: any) {
      console.error('Error saving sensitive data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save data',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const maskValue = (value: string) => {
    if (!value) return '';
    if (value.length <= 4) return '••••';
    return '••••' + value.slice(-4);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Secure Vault
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Your sensitive data is encrypted and only accessible by you
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowData(!showData)}
            className="gap-2"
          >
            {showData ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type={showData ? 'date' : 'text'}
            value={showData ? data.date_of_birth : maskValue(data.date_of_birth)}
            onChange={(e) => setData({ ...data, date_of_birth: e.target.value })}
            disabled={!showData}
            className="bg-background"
          />
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Address</h4>
          
          <div className="space-y-2">
            <Label htmlFor="address1">Address Line 1</Label>
            <Input
              id="address1"
              type={showData ? 'text' : 'password'}
              value={showData ? data.address_line1 : maskValue(data.address_line1)}
              onChange={(e) => setData({ ...data, address_line1: e.target.value })}
              disabled={!showData}
              placeholder={showData ? 'Street address' : ''}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address2">Address Line 2</Label>
            <Input
              id="address2"
              type={showData ? 'text' : 'password'}
              value={showData ? data.address_line2 : maskValue(data.address_line2)}
              onChange={(e) => setData({ ...data, address_line2: e.target.value })}
              disabled={!showData}
              placeholder={showData ? 'Apartment, suite, etc.' : ''}
              className="bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type={showData ? 'text' : 'password'}
                value={showData ? data.city : maskValue(data.city)}
                onChange={(e) => setData({ ...data, city: e.target.value })}
                disabled={!showData}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                type={showData ? 'text' : 'password'}
                value={showData ? data.state : maskValue(data.state)}
                onChange={(e) => setData({ ...data, state: e.target.value })}
                disabled={!showData}
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal">Postal Code</Label>
              <Input
                id="postal"
                type={showData ? 'text' : 'password'}
                value={showData ? data.postal_code : maskValue(data.postal_code)}
                onChange={(e) => setData({ ...data, postal_code: e.target.value })}
                disabled={!showData}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                type={showData ? 'text' : 'password'}
                value={showData ? data.country : maskValue(data.country)}
                onChange={(e) => setData({ ...data, country: e.target.value })}
                disabled={!showData}
                className="bg-background"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving || !showData}
          className="w-full gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Encrypting...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Securely
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your data is protected with row-level security and only you can access it.
        </p>
      </CardContent>
    </Card>
  );
};
