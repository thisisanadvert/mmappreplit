import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  Home,
  MapPin,
  CheckCircle2, 
  ArrowRight,
  Save,
  AlertTriangle,
  Info
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useFeatures } from '../hooks/useFeatures';

const BuildingSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isDevelopmentEnvironment } = useFeatures();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [buildingData, setBuildingData] = useState({
    name: user?.metadata?.buildingName || '',
    address: user?.metadata?.buildingAddress || '',
    totalUnits: 0,
    buildingAge: 0,
    buildingType: '',
    serviceChargeFrequency: 'Quarterly',
    managementStructure: user?.role?.includes('rtm') ? 'rtm' : 'share-of-freehold'
  });

  useEffect(() => {
    const fetchBuildingData = async () => {
      // Try to get building ID from user metadata
      let buildingId = user?.metadata?.buildingId;
      
      if (!buildingId && user?.id) {
        // If not in metadata, try to get it from building_users table
        try {
          const { data: buildingUserData, error: buildingUserError } = await supabase
            .from('building_users')
            .select('building_id')
            .eq('user_id', user?.id)
            .maybeSingle();
            
          if (buildingUserError) {
            console.error('Error fetching building user data:', buildingUserError);
            setIsLoading(false);
            return;
          }
          
          if (buildingUserData) {
            buildingId = buildingUserData.building_id;
            
            // Update user metadata with the building ID
            await supabase.auth.updateUser({
              data: { buildingId: buildingId }
            });
          } else {
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching building user data:', error);
          setIsLoading(false);
          return;
        }
      }

      try {
        const { data, error } = await supabase
          .from('buildings')
          .select('*')
          .eq('id', buildingId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setBuildingData({
            name: data.name || '',
            address: data.address || user?.metadata?.buildingAddress || '',
            totalUnits: data.total_units || 1,
            buildingAge: data.building_age || null,
            buildingType: data.building_type || null,
            serviceChargeFrequency: data.service_charge_frequency || 'Quarterly',
            managementStructure: data.management_structure || (user?.role?.includes('rtm') ? 'rtm' : 'share-of-freehold')
          });
        }
      } catch (error: any) {
        console.error('Error fetching building data:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuildingData();
  }, [user?.metadata?.buildingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBuildingData(prev => ({
      ...prev,
      [name]: name === 'totalUnits' || name === 'buildingAge' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // Get the building ID from user metadata or from building_users table
      let buildingId = user?.metadata?.buildingId;
      
      if (!buildingId && user?.id) {
        // Try to find the building ID from the building_users table
        const { data: buildingUserData, error: buildingUserError } = await supabase
          .from('building_users')
          .select('building_id')
          .eq('user_id', user?.id)
          .maybeSingle();
          
        if (buildingUserError) {
          console.error('Error finding building:', buildingUserError);
          throw new Error('Error finding your building: ' + buildingUserError.message);
        }
        
        if (buildingUserData) {
          buildingId = buildingUserData.building_id;
          
          // Update user metadata with the building ID
          await supabase.auth.updateUser({
            data: { buildingId: buildingId }
          });
        } else {
          // If no building found, create a new one
          const { data: newBuilding, error: newBuildingError } = await supabase
            .from('buildings')
            .insert({
              name: buildingData.name,
              address: buildingData.address,
              total_units: buildingData.totalUnits,
              building_age: buildingData.buildingAge,
              building_type: buildingData.buildingType,
              service_charge_frequency: buildingData.serviceChargeFrequency,
              management_structure: buildingData.managementStructure
            })
            .select()
            .maybeSingle();
            
          if (newBuildingError) throw newBuildingError;
          
          if (newBuilding) {
            buildingId = newBuilding.id;
            
            // Create building_users entry
            const { error: buildingUserError } = await supabase
              .from('building_users')
              .insert([
                {
                  building_id: buildingId,
                  user_id: user.id,
                  role: user.role
                }
              ], { returning: 'minimal' });
              
            if (buildingUserError) throw buildingUserError;
            
            // Update user metadata with the building ID
            await supabase.auth.updateUser({
              data: { buildingId: buildingId }
            });
          }
        }
      }
      
      if (!buildingId) throw new Error('Could not find or create a building. Please contact support.');

      const { data, error } = await supabase
        .from('buildings')
        .update({
          name: buildingData.name,
          address: buildingData.address,
          total_units: buildingData.totalUnits,
          building_age: buildingData.buildingAge,
          building_type: buildingData.buildingType,
          service_charge_frequency: buildingData.serviceChargeFrequency,
          management_structure: buildingData.managementStructure
        })
        .eq('id', buildingId)
        .select('*');

      if (error) throw error;

      // Update onboarding steps if they exist
      const { error: stepsError } = await supabase
        .from('onboarding_steps')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('step_name', 'building');

      if (stepsError) console.error('Error updating onboarding step:', stepsError);

      setSuccess(true);
      setTimeout(() => {
        const basePath = user?.role?.split('-')[0];
        navigate(`/${basePath || ''}`);
      }, 2000);
    } catch (error: any) {
      setError(error.message);
      console.error('Building setup error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 lg:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Building Setup</h1>
          <p className="text-gray-600 mt-1">Configure your building information</p>
        </div>
      </div>

      <Card>
        {success ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-success-100 p-4">
              <CheckCircle2 className="h-8 w-8 text-success-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Building Setup Complete!</h3>
            <p className="text-center text-gray-600">
              Your building information has been saved successfully. This data will be used to customize your dashboard and provide relevant features.
            </p>
            <Button 
              variant="primary" 
              className="mt-6"
              onClick={() => {
                const basePath = user?.role?.split('-')[0];
                navigate(`/${basePath || ''}`);
              }}
            >
              Return to Dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="mb-4 rounded-md bg-error-50 p-4 text-sm text-error-500 flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-primary-800 font-medium">Building Information</h3>
                  <p className="text-primary-700 text-sm mt-1">
                    This information will be used to set up your building profile and customize your experience. You can update these details later if needed.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Building Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={buildingData.name}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Waterside Apartments"
                    autoFocus
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  The name of your building or development
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Building Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="address"
                    value={buildingData.address}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., 123 Riverside Drive, London SE1"
                    autoComplete="street-address"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Full address of the building
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Units
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="totalUnits"
                    value={buildingData.totalUnits}
                    onChange={handleChange}
                    min="1"
                    required
                    placeholder="e.g., 24"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Total number of units in your building
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Building Age (years)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="buildingAge"
                    value={buildingData.buildingAge}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g., 25"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Approximate age of the building in years
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Building Type
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={16} className="text-gray-400" />
                  </div>
                  <select
                    name="buildingType"
                    value={buildingData.buildingType}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Building Type</option>
                    <option value="apartment-block">Apartment Block / Flats</option>
                    <option value="converted-house">Converted House / Period Conversion</option>
                    <option value="mixed-use">Mixed Use Development</option>
                    <option value="mansion-block">Mansion Block</option>
                    <option value="townhouse">Townhouse / Terraced</option>
                    <option value="detached">Detached Building</option>
                    <option value="semi-detached">Semi-Detached Building</option>
                    <option value="other">Other Building Type</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Type of building structure
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Service Charge Frequency
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <select
                    name="serviceChargeFrequency"
                    value={buildingData.serviceChargeFrequency}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly (Most Common)</option>
                    <option value="Bi-Annually">Bi-Annually</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  How often service charges are collected
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Management Structure
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={16} className="text-gray-400" />
                  </div>
                  <select
                    name="managementStructure"
                    value={buildingData.managementStructure}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    disabled={true} // Disabled because it's determined by user role
                  >
                    <option value="rtm">Right to Manage (RTM) Company</option>
                    <option value="share-of-freehold">Share of Freehold Company</option>
                    <option value="landlord-managed">Landlord Managed Property</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Management structure is determined by your account role
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                leftIcon={<Save size={16} />}
                isLoading={isSaving}
              >
                Save Building Information
              </Button>
            </div>
          </form>
        )}
      </Card>
      
      {!success && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-6">
          <h3 className="text-gray-700 font-medium mb-2 flex items-center">
            <Info size={16} className="mr-2 text-primary-600" />
            Why is this information important?
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Providing accurate building information helps us:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-start">
              <CheckCircle2 size={16} className="text-success-500 mr-2 mt-0.5" />
              <span>Customize your dashboard with relevant features for your building type</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 size={16} className="text-success-500 mr-2 mt-0.5" />
              <span>Generate appropriate financial reports and service charge schedules</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 size={16} className="text-success-500 mr-2 mt-0.5" />
              <span>Provide tailored compliance recommendations for your building type</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 size={16} className="text-success-500 mr-2 mt-0.5" />
              <span>Help you manage your building more effectively with the right tools</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BuildingSetup;