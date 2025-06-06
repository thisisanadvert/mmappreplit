import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  Video,
  Download,
  Users,
  FileText,
  ChevronRight,
  CheckCircle2,
  Play,
  MessageSquare
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const AGMs = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const agms = [
    {
      id: 1,
      title: 'Annual General Meeting 2025',
      description: 'Annual review of building management, financial reports, and upcoming major works.',
      date: '2025-06-15',
      time: '19:00',
      location: 'Building Community Room',
      status: 'upcoming',
      documents: [
        { name: 'Agenda', type: 'pdf' },
        { name: 'Financial Report', type: 'pdf' },
        { name: 'Major Works Plan', type: 'pdf' }
      ],
      attendees: 18,
      totalEligible: 24
    },
    {
      id: 2,
      title: 'Extraordinary General Meeting - Major Works',
      description: 'Discussion and vote on proposed facade repairs and window replacement program.',
      date: '2025-03-15',
      time: '18:30',
      location: 'Virtual Meeting',
      status: 'completed',
      recording: 'https://example.com/recording',
      minutes: 'https://example.com/minutes',
      documents: [
        { name: 'Minutes', type: 'pdf' },
        { name: 'Presentation', type: 'pdf' },
        { name: 'Contractor Quotes', type: 'pdf' }
      ],
      attendees: 20,
      totalEligible: 24,
      decisions: [
        'Approved facade repairs budget of £85,000',
        'Selected contractor: BuildRight Ltd',
        'Works to commence July 2025'
      ]
    },
    {
      id: 3,
      title: 'Annual General Meeting 2024',
      description: 'Annual review including financial reports, management updates, and election of directors.',
      date: '2024-06-20',
      time: '19:00',
      location: 'Building Community Room',
      status: 'completed',
      recording: 'https://example.com/recording',
      minutes: 'https://example.com/minutes',
      documents: [
        { name: 'Minutes', type: 'pdf' },
        { name: 'Financial Report', type: 'pdf' },
        { name: 'Audit Report', type: 'pdf' }
      ],
      attendees: 22,
      totalEligible: 24,
      decisions: [
        'Approved annual accounts',
        'Re-elected board members',
        'Approved 2025 budget'
      ]
    },
    {
      id: 4,
      title: 'Extraordinary General Meeting - Security Upgrade',
      description: 'Special meeting to discuss and approve building security enhancement project.',
      date: '2024-09-10',
      time: '18:00',
      location: 'Virtual Meeting',
      status: 'completed',
      recording: 'https://example.com/recording',
      minutes: 'https://example.com/minutes',
      documents: [
        { name: 'Minutes', type: 'pdf' },
        { name: 'Security Proposal', type: 'pdf' },
        { name: 'Cost Analysis', type: 'pdf' }
      ],
      attendees: 19,
      totalEligible: 24,
      decisions: [
        'Approved security system upgrade',
        'Budget allocation of £25,000',
        'Implementation timeline approved'
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'accent';
      case 'completed':
        return 'success';
      default:
        return 'gray';
    }
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annual General Meetings</h1>
          <p className="text-gray-600 mt-1">Schedule and manage building AGMs</p>
        </div>
        <Button 
          leftIcon={<Plus size={16} />}
          variant="primary"
        >
          Schedule AGM
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search AGMs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
            />
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            >
              <option value="all">All Meetings</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Past Meetings</option>
            </select>
            <Button 
              variant="outline"
              leftIcon={<Filter size={16} />}
            >
              More Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {agms.map((agm) => (
          <Card key={agm.id} hoverable className="animate-slide-up">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${
                agm.status === 'upcoming' ? 'bg-accent-100' : 'bg-success-100'
              }`}>
                <Calendar className={`h-5 w-5 ${
                  agm.status === 'upcoming' ? 'text-accent-600' : 'text-success-600'
                }`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getStatusColor(agm.status)} size="sm">
                    {agm.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock size={14} className="mr-1" />
                    <span>{agm.date} at {agm.time}</span>
                  </div>
                </div>

                <h3 className="text-lg font-medium">{agm.title}</h3>
                <p className="mt-1 text-gray-600">{agm.description}</p>

                {agm.status === 'completed' && agm.decisions && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2">Key Decisions:</h4>
                    <ul className="space-y-1">
                      {agm.decisions.map((decision, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <CheckCircle2 size={16} className="text-success-500 mt-0.5 mr-2" />
                          <span>{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{agm.attendees}/{agm.totalEligible} Attendees</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText size={14} />
                    <span>{agm.documents.length} Documents</span>
                  </div>
                  {agm.status === 'completed' && (
                    <>
                      <div className="flex items-center gap-1">
                        <Video size={14} />
                        <span>Recording Available</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        <span>Minutes Available</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {agm.status === 'completed' ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      leftIcon={<Play size={16} />}
                    >
                      Watch Recording
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      leftIcon={<Download size={16} />}
                    >
                      Download Minutes
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="primary" 
                    size="sm"
                    rightIcon={<ChevronRight size={16} />}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AGMs;