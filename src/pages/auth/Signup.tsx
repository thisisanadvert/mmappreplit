import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  UserPlus, 
  Building, 
  Users, 
  Shield, 
  ArrowRight, 
  CheckCircle2,
  AlertTriangle, 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  Home
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';

type SignupType = 'rtm-director' | 'sof-director' | 'homeowner' | 'management-company';

interface SignupFormData {
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
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
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
    setShowSignupForm(true);
  };

  // Store registration in local storage as a fallback
  const storeLocalRegistration = () => {
    try {
      localStorage.setItem('pendingRegistration', JSON.stringify({
        ...formData,
        timestamp: new Date().toISOString()
      }));
      console.log('Stored registration data locally');
      return true;
    } catch (err) {
      console.error('Error storing registration locally:', err);
      return false;
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Generate a temporary password
      const tempPassword = `Temp${Math.floor(Math.random() * 1000000)}!`;
      
      // Create user account
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            buildingName: formData.buildingName,
            buildingAddress: formData.buildingAddress,
            unitNumber: formData.unitNumber,
            phone: formData.phone,
            companyName: formData.companyName
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Sign in the user automatically
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: tempPassword
      });
      
      if (signInError && signInError.message !== 'Email not confirmed') {
        throw new Error('Failed to sign in automatically. Please try signing in manually.');
      }
      
      // Show success and redirect
      setFormSubmitted(true);
      
      // Only redirect if sign in was successful
      if (!signInError) {
        setTimeout(() => {
          const basePath = formData.role.split('-')[0];
          navigate(`/${basePath}`);
        }, 2000);
      }
      
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again or contact support.');
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h3>
              <p className="text-gray-600 mb-8 max-w-md">
                Your account has been created. You can now sign in to access the platform.
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
            {!showSignupForm ? (
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
                    Create your account as a {selectedOption?.title}.
                  </p>
                </div>

                <form onSubmit={handleSignupSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      {error}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1 block w-full pl-10 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          First Name
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={16} className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="mt-1 block w-full pl-10 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Last Name
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={16} className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="mt-1 block w-full pl-10 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="mt-1 block w-full pl-10 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="e.g., 020 1234 5678"
                        />
                      </div>
                    </div>

                    {selectedOption?.fields?.includes('buildingName') && (
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
                            required
                            value={formData.buildingName || ''}
                            onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                            className="mt-1 block w-full pl-10 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            placeholder="e.g., Waterside Apartments"
                          />
                        </div>
                      </div>
                    )}

                    {selectedOption?.fields?.includes('buildingAddress') && (
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
                            required
                            value={formData.buildingAddress || ''}
                            onChange={(e) => setFormData({ ...formData, buildingAddress: e.target.value })}
                            className="mt-1 block w-full pl-10 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            placeholder="e.g., 123 Riverside Drive, London SE1"
                          />
                        </div>
                      </div>
                    )}

                    {selectedOption?.fields?.includes('unitNumber') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Unit Number
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Home size={16} className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            required
                            value={formData.unitNumber || ''}
                            onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                            className="mt-1 block w-full pl-10 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            placeholder="e.g., 3B"
                          />
                        </div>
                      </div>
                    )}

                    {selectedOption?.fields?.includes('companyName') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Company Name
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase size={16} className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            required
                            value={formData.companyName || ''}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            className="mt-1 block w-full pl-10 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            placeholder="e.g., ABC Property Management Ltd"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowSignupForm(false)}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Create Account
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