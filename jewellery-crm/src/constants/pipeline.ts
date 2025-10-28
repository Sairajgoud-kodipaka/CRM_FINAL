// Pipeline Status Configuration
export interface PipelineStatus {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  description: string;
  noteRequired: boolean;
  allowedTransitions: string[];
  isTerminal: boolean;
  priority: number; // For ordering
}

export const PIPELINE_STATUSES: PipelineStatus[] = [
  {
    id: 'new_uncontacted',
    label: 'New / Uncontacted',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: 'UserPlus',
    description: 'Lead assigned, no attempt yet',
    noteRequired: false,
    allowedTransitions: ['attempted_contact', 'missed_call_outbound', 'missed_call_inbound'],
    isTerminal: false,
    priority: 1
  },
  {
    id: 'attempted_contact',
    label: 'Attempted Contact',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: 'Phone',
    description: 'Outbound call placed, no answer',
    noteRequired: true,
    allowedTransitions: ['contacted_in_progress', 'missed_call_outbound', 'follow_up_scheduled'],
    isTerminal: false,
    priority: 2
  },
  {
    id: 'missed_call_outbound',
    label: 'Missed Call (Outbound)',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    icon: 'PhoneOff',
    description: 'Telecaller tried, customer didn\'t pick up. Auto-create follow-up',
    noteRequired: true,
    allowedTransitions: ['attempted_contact', 'follow_up_scheduled', 'contacted_in_progress'],
    isTerminal: false,
    priority: 3
  },
  {
    id: 'missed_call_inbound',
    label: 'Missed Call (Inbound)',
    color: 'amber',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    icon: 'PhoneMissed',
    description: 'Customer called, telecaller missed. Auto-create follow-up',
    noteRequired: true,
    allowedTransitions: ['attempted_contact', 'follow_up_scheduled', 'contacted_in_progress'],
    isTerminal: false,
    priority: 4
  },
  {
    id: 'contacted_in_progress',
    label: 'Contacted / In Progress',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    icon: 'MessageCircle',
    description: 'Conversation happened, not yet qualified',
    noteRequired: true,
    allowedTransitions: ['follow_up_scheduled', 'interested_warm', 'qualified', 'not_interested'],
    isTerminal: false,
    priority: 5
  },
  {
    id: 'follow_up_scheduled',
    label: 'Follow-up Scheduled',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    icon: 'Calendar',
    description: 'Callback or meeting set',
    noteRequired: true,
    allowedTransitions: ['attempted_contact', 'contacted_in_progress', 'interested_warm', 'not_interested'],
    isTerminal: false,
    priority: 6
  },
  {
    id: 'interested_warm',
    label: 'Interested / Warm',
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    icon: 'Heart',
    description: 'Customer shows intent, needs nurturing',
    noteRequired: true,
    allowedTransitions: ['qualified', 'follow_up_scheduled', 'not_interested'],
    isTerminal: false,
    priority: 7
  },
  {
    id: 'qualified',
    label: 'Qualified',
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    icon: 'CheckCircle',
    description: 'Lead meets criteria (budget, authority, need, timeline)',
    noteRequired: true,
    allowedTransitions: ['converted_closed_won', 'follow_up_scheduled', 'lost_closed_lost'],
    isTerminal: false,
    priority: 8
  },
  {
    id: 'not_interested',
    label: 'Not Interested',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: 'XCircle',
    description: 'Customer explicitly declined',
    noteRequired: true,
    allowedTransitions: ['follow_up_scheduled', 'lost_closed_lost'],
    isTerminal: false,
    priority: 9
  },
  {
    id: 'converted_closed_won',
    label: 'Converted / Closed Won',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: 'Trophy',
    description: 'Lead became a customer',
    noteRequired: true,
    allowedTransitions: [],
    isTerminal: true,
    priority: 10
  },
  {
    id: 'lost_closed_lost',
    label: 'Lost / Closed Lost',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: 'Ban',
    description: 'Lead dropped out or unresponsive',
    noteRequired: true,
    allowedTransitions: ['follow_up_scheduled'],
    isTerminal: true,
    priority: 11
  }
];

// Pipeline lanes for Kanban view
export const PIPELINE_LANES = [
  {
    id: 'new_leads',
    title: 'New Leads',
    statuses: ['new_uncontacted', 'attempted_contact']
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    statuses: ['missed_call_outbound', 'missed_call_inbound', 'contacted_in_progress', 'follow_up_scheduled']
  },
  {
    id: 'nurturing',
    title: 'Nurturing',
    statuses: ['interested_warm', 'qualified']
  },
  {
    id: 'completed',
    title: 'Completed',
    statuses: ['converted_closed_won', 'lost_closed_lost', 'not_interested']
  }
];

// Quick note templates organized by status
export const NOTE_TEMPLATES_BY_STATUS = {
  new_uncontacted: [
    'Lead assigned to telecaller',
    'Ready to make first contact',
    'Customer details verified'
  ],
  attempted_contact: [
    'No answer - try again later',
    'Busy - call back tomorrow',
    'Phone switched off',
    'Ringing but no pickup',
    'Wrong number - need to verify'
  ],
  missed_call_outbound: [
    'Customer didn\'t pick up - auto follow-up scheduled',
    'Phone busy - will retry',
    'No response after 3 attempts',
    'Customer requested callback',
    'Line engaged - follow up needed'
  ],
  missed_call_inbound: [
    'Customer called but missed - urgent callback needed',
    'Missed customer call - immediate follow-up',
    'Customer tried to reach us',
    'Callback request from customer',
    'Missed opportunity - need to reconnect'
  ],
  contacted_in_progress: [
    'Initial conversation completed',
    'Customer showed interest',
    'Needs more information',
    'Budget discussion started',
    'Product preferences discussed',
    'Timeline not clear yet',
    'Customer wants to think about it'
  ],
  follow_up_scheduled: [
    'Callback scheduled for tomorrow',
    'Meeting set for next week',
    'Customer requested specific time',
    'Follow-up call planned',
    'Store visit scheduled',
    'Product demo arranged',
    'Price discussion scheduled'
  ],
  interested_warm: [
    'Customer shows strong interest',
    'Budget range discussed',
    'Product preferences identified',
    'Timeline established',
    'Ready for detailed discussion',
    'Customer asking questions',
    'Comparing options'
  ],
  qualified: [
    'BANT criteria met (Budget, Authority, Need, Timeline)',
    'Decision maker identified',
    'Budget confirmed',
    'Timeline established',
    'Ready for proposal',
    'All requirements clear',
    'Customer ready to buy'
  ],
  not_interested: [
    'Customer explicitly declined',
    'Not interested in jewelry',
    'Budget constraints',
    'Timing not right',
    'Found alternative solution',
    'Changed mind',
    'Not the right fit'
  ],
  converted_closed_won: [
    'Sale completed successfully',
    'Customer converted',
    'Order placed',
    'Payment received',
    'Delivery scheduled',
    'Customer satisfied',
    'Repeat customer potential'
  ],
  lost_closed_lost: [
    'Lead went cold',
    'Customer unresponsive',
    'Lost to competitor',
    'Budget issues',
    'Timing problems',
    'Customer dropped out',
    'No longer interested'
  ]
};

// Legacy note templates for backward compatibility
export const NOTE_TEMPLATES = [
  'No answer',
  'Busy - call back later',
  'Call back tomorrow',
  'Interested in gold jewelry',
  'Interested in diamond jewelry',
  'Interested in festival collection',
  'Budget discussion needed',
  'Wants to visit store',
  'Not interested right now',
  'Wrong number',
  'Customer requested callback',
  'Follow-up scheduled',
  'Qualified - ready for sales',
  'Converted to customer'
];

// Helper functions
export const getStatusById = (id: string): PipelineStatus | undefined => {
  return PIPELINE_STATUSES.find(status => status.id === id);
};

export const getStatusColor = (id: string): string => {
  const status = getStatusById(id);
  return status ? status.color : 'gray';
};

export const canTransitionTo = (fromStatus: string, toStatus: string): boolean => {
  const status = getStatusById(fromStatus);
  return status ? status.allowedTransitions.includes(toStatus) : false;
};

export const getNextPossibleStatuses = (currentStatus: string): PipelineStatus[] => {
  const status = getStatusById(currentStatus);
  if (!status) return [];

  return status.allowedTransitions
    .map(id => getStatusById(id))
    .filter(Boolean) as PipelineStatus[];
};

// Get note templates for a specific status
export const getNoteTemplatesForStatus = (statusId: string): string[] => {
  return NOTE_TEMPLATES_BY_STATUS[statusId as keyof typeof NOTE_TEMPLATES_BY_STATUS] || [];
};

// Get all statuses that are terminal (conversion or loss)
export const getTerminalStatuses = (): PipelineStatus[] => {
  return PIPELINE_STATUSES.filter(status => status.isTerminal);
};

// Get all active statuses (non-terminal)
export const getActiveStatuses = (): PipelineStatus[] => {
  return PIPELINE_STATUSES.filter(status => !status.isTerminal);
};

