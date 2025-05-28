import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, UserPlus, Building, Users, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

type SignupType = 'rtm-director' | 'sof-director' | 'homeowner' | 'management-company';

interface WaitlistFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: SignupType;
  buildingName?: string;
  buildingAddress?: string;
  unitNumber?: string;
  companyName?: string;
  phone?: string;
}

const signupOptions = [
  {
    id: 'rtm-director',
    title: 'Right to Manage Director',
    description: 'Join as an RTM director or express interest in becoming one',
    icon: UserPlus,
    color: 'bg-primary-100 text-primary-600',
    available: true,
    fields: ['buildingName', 'buildingAddress', 'unitNumber', 'phone']
  },
  {
    id: 'sof-director',
    title: 'Share of Freehold Director',
    description: 'Manage your Share of Freehold company and building',
    icon: Building,
    color: 'bg-secondary-100 text-secondary-600',
    available: true,
    fields: ['buildingName', 'buildingAddress', 'unitNumber', 'phone']
  },
  {
    id: 'homeowner',
    title: 'Homeowner',
    description: 'Access your building\'s management platform and participate in decisions',
    icon: Users,
    color: 'bg-accent-100 text-accent-600',
    subtypes: [
      { id: 'leaseholder', label: 'Leaseholder' },
      { id: 'shareholder', label: 'Share of Freeholder' }
    ],
    fields: ['buildingName', 'unitNumber', 'phone'],
    available: false
  },
  {
    id: 'management-company',
    title: 'Management Company',
    description: 'Manage multiple properties with transparency and efficiency',
    icon: Shield,
    color: 'bg-warning-100 text-warning-600',
    fields: ['companyName', 'phone'],
    available: false
  }
];

const Signup = () => {
  const [selectedType, setSelectedType] = useState<SignupType>('rtm-director');
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState<WaitlistFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'rtm-director'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleOptionClick = (type: SignupType) => {
    setSelectedType(type);
    const option = signupOptions.find(opt => opt.id === type);
    setFormData(prev => ({ ...prev, role: type }));
    setShowWaitlistForm(true);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Use the register-interest edge function instead of direct auth signup
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          buildingName: formData.buildingName,
          buildingAddress: formData.buildingAddress,
          unitNumber: formData.unitNumber,
          phone: formData.phone
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register interest');
      }
      
      setFormSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(typeof error === 'object' && error !== null ? (error as Error).message : 'Failed to register interest');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOption = signupOptions.find(opt => opt.id === selectedType);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="bg-primary-600 text-white p-2 rounded">
              <Building2 size={24} />
            </div>
            <span className="text-2xl font-bold text-primary-800 pixel-font">Manage.Management</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        {!formSubmitted ? (
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        ) : (
          <p className="mt-2 text-center text-sm text-gray-600">
            Thank you for your interest!
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        {formSubmitted ? (
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 text-center">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-success-50 p-4 rounded-full mb-6">
                <CheckCircle2 size={48} className="text-success-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You for Your Interest!</h3>
              <p className="text-gray-600 mb-8 max-w-md">
                We've received your registration for the Manage.Management beta. We'll be in touch soon with more information about accessing the platform.
              </p>
              <div className="space-y-4">
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Sign In
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Return to Home
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
            {!showWaitlistForm ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {signupOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option.id as SignupType)}
                      className={`relative p-6 border-2 rounded-lg text-left transition-all ${
                        selectedType === option.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${option.color}`}>
                          <option.icon size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">{option.title}</h3>
                            {!option.available && (
                              <Badge variant="accent">Coming Soon</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-gray-600">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Tell us about yourself</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    We'll notify you when beta access is available for {selectedOption?.title}.
                  </p>
                </div>

                <form onSubmit={handleWaitlistSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
                      {error}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          First Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Last Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    {selectedOption?.fields?.includes('buildingName') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Building Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.buildingName || ''}
                          onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    )}

                    {selectedOption?.fields?.includes('buildingAddress') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Building Address
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.buildingAddress || ''}
                          onChange={(e) => setFormData({ ...formData, buildingAddress: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    )}

                    {selectedOption?.fields?.includes('unitNumber') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Unit Number
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.unitNumber || ''}
                          onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    )}

                    {selectedOption?.fields?.includes('companyName') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Company Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.companyName || ''}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowWaitlistForm(false)}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmitting}
                    >
                      Register Interest
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;