import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Shield, 
  Check, 
  CreditCard,
  ArrowRight,
  Calculator,
  Percent,
  Building,
  BadgeCheck
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const Pricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      id: 'rtm',
      name: 'Right to Manage Directors',
      description: 'For Right to Manage directors and committees',
      price: 'Get started for free',
      icon: Building2,
      features: [
        'Full building management platform',
        'Unlimited leaseholders',
        'Document management',
        'Financial oversight',
        'Maintenance tracking',
        'Voting system',
        'AGM management',
        'Service charge collection',
        'Supplier network access',
        'Analytics and reporting'
      ],
      cta: 'Register Interest',
      popular: false
    },
    {
      id: 'leaseholder',
      name: 'Leaseholders & Share of Freeholders',
      description: 'For individual leaseholders and share of freeholders',
      price: 'Variable',
      subPrice: 'Set by RTM Director',
      icon: Users,
      features: [
        'Digital service charge payments',
        'Maintenance request tracking',
        'Document access',
        'Building announcements',
        'Voting participation',
        'AGM attendance',
        'Direct communication',
        'Payment history',
        'Mobile app access',
        'Email notifications'
      ],
      cta: 'Register Interest',
      popular: true
    },
    {
      id: 'management',
      name: 'Management Companies',
      description: 'For transparent property management companies',
      price: 'Contact us',
      subPrice: 'for pricing details',
      icon: Shield,
      features: [
        'Multi-building management',
        'Transparent financial reporting',
        'Service charge collection',
        'Maintenance coordination',
        'Document management',
        'Communication tools',
        'Analytics dashboard',
        'Supplier management',
        'AGM organization',
        'API access'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="px-4"
              onClick={() => navigate('/')}
            >
              Home
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="px-4"
              onClick={() => navigate('/pricing')}
            >
              Pricing
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="px-4"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="px-4"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              className="px-6"
              onClick={() => navigate('/signup')}
            >
              Create Account
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that best fits your role in property management
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative ${plan.popular ? 'mt-6' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-primary-600 text-white px-3 py-1 rounded-full shadow-lg">
                    <span className="text-xs font-medium">Most popular</span>
                  </div>
                </div>
              )}
              <Card
                className={`relative flex flex-col h-full ${
                  plan.popular ? 'ring-2 ring-primary-500 shadow-xl' : ''
                }`}
              >
                <div className="p-6 flex-1">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${
                      plan.id === 'rtm' ? 'bg-primary-100 text-primary-600' :
                      plan.id === 'leaseholder' ? 'bg-secondary-100 text-secondary-600' :
                      'bg-accent-100 text-accent-600'
                    }`}>
                      <plan.icon size={24} />
                    </div>
                    <Badge variant={
                      plan.id === 'rtm' ? 'primary' :
                      plan.id === 'leaseholder' ? 'secondary' :
                      'accent'
                    }>
                      {plan.id === 'rtm' ? 'Free' :
                       plan.id === 'leaseholder' ? 'Pay as you go' :
                       'Enterprise'}
                    </Badge>
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-gray-600">{plan.description}</p>

                  <div className="mt-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    </div>
                    {plan.subPrice && (
                      <div className="mt-1 text-sm text-gray-500">{plan.subPrice}</div>
                    )}
                  </div>

                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full"
                    onClick={() => navigate('/signup')}
                  >
                    Create Account
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Transparent Fee Structure
                </h2>
                <p className="mt-4 text-gray-600">
                  We believe in complete transparency with our pricing. Our fee structure is designed to align with your success while keeping costs predictable and manageable.
                </p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Calculator className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">Service Charge Collection</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Small percentage fee on successful collections to cover processing costs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="p-2 bg-secondary-100 rounded-lg">
                      <Percent className="h-6 w-6 text-secondary-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">Transaction Fees</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Competitive rates for payment processing and transfers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="p-2 bg-accent-100 rounded-lg">
                      <Building className="h-6 w-6 text-accent-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">Building Management</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Custom pricing based on your building portfolio
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="p-2 bg-success-100 rounded-lg">
                      <BadgeCheck className="h-6 w-6 text-success-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">No Hidden Fees</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        All costs are clearly communicated upfront
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:border-l lg:border-gray-200 lg:pl-8">
                <h3 className="text-lg font-semibold text-gray-900">
                  Have questions about pricing?
                </h3>
                <p className="mt-4 text-gray-600">
                  Our team is ready to help you understand our pricing structure and find the best solution for your needs.
                </p>
                <div className="mt-6 space-y-3">
                  <Button
                    variant="primary"
                    className="w-full"
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;