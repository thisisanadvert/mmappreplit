import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, UserPlus, Building, Users, Shield, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

type SignupType = 'rtm-director' | 'sof-director' | 'homeowner' | 'management-company';

const signupOptions = [
  {
    id: 'rtm-director',
    title: 'Right to Manage Director',
    description: 'Join as an RTM director or express interest in becoming one',
    icon: UserPlus,
    color: 'bg-primary-100 text-primary-600',
    available: true
  },
  {
    id: 'sof-director',
    title: 'Share of Freehold Director',
    description: 'Manage your Share of Freehold company and building',
    icon: Building,
    color: 'bg-secondary-100 text-secondary-600',
    available: true
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
    available: false
  },
  {
    id: 'management-company',
    title: 'Management Company',
    description: 'Manage multiple properties with transparency and efficiency',
    icon: Shield,
    color: 'bg-warning-100 text-warning-600',
    available: false
  }
];

const Signup = () => {
  const [selectedType, setSelectedType] = useState<SignupType>('rtm-director');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('');
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const navigate = useNavigate();

  const handleOptionClick = (type: SignupType) => {
    setSelectedType(type);
    const option = signupOptions.find(opt => opt.id === type);
    if (!option?.available) {
      setShowWaitlistForm(true);
    }
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for joining the waitlist! We\'ll notify you when registration opens.');
    setWaitlistEmail('');
    setShowWaitlistForm(false);
  };

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
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
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
                      
                      {option.subtypes && selectedType === option.id && (
                        <div className="mt-4 space-x-4">
                          {option.subtypes.map(subtype => (
                            <button
                              key={subtype.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubtype(subtype.id);
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedSubtype === subtype.id
                                  ? 'bg-primary-100 text-primary-800'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {subtype.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {showWaitlistForm ? (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Join the Waitlist</h3>
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="waitlist-email" className="block text-sm font-medium text-gray-900 mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      id="waitlist-email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 shadow-sm text-base"
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" className="w-full py-3 text-base">
                    Join Waitlist
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  rightIcon={<ArrowRight size={16} />}
                  onClick={() => navigate('/signup/details')}
                  disabled={!signupOptions.find(opt => opt.id === selectedType)?.available}
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;