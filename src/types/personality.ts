export interface ChatBackdrop {
  type: 'gradient' | 'pattern';
  gradient: string;
  pattern?: string;
  patternOpacity?: number;
  overlayColor?: string;
  textColor?: string;
  backgroundImage?: string;
}

export interface Personality {
  id: number;
  name: string;
  description: string;
  specialty: string;
  is_custom?: boolean;
  is_default?: boolean;
  visuals: {
    primaryColor: string;
    secondaryColor: string;
    borderColor: string;
    textColor: string;
    chatBubble: {
      backgroundColor: string;
      borderColor: string;
      borderWidth: string;
      borderStyle: string;
      borderRadius: string;
      textColor: string;
    };
    selectionCard: {
      backgroundColor: string;
      hoverBackgroundColor: string;
      borderColor: string;
      textColor: string;
      image?: string;
      badge?: string;
      badgeColor?: string;
    };
    chatBackdrop: ChatBackdrop;
    icon?: string;
  };
}

export type PersonalityFromDB = {
  id: number;
  name: string;
  specialization: string;
  therapeutic_style: string;
  credentials: string;
  is_custom?: boolean;
  is_default?: boolean;
  profile: {
    spec: string;
    spec_version: string;
    data: {
      name: string;
      who_you_are: string;
      your_vibe: string;
      your_worldview: string;
      session_template: string;
      session_examples: Array<{
        user_situation: string;
        your_response: string;
        approach: string;
      }>;
      tags: string[];
      visuals: {
        primaryColor: string;
        secondaryColor: string;
        borderColor: string;
        textColor: string;
        chatBubble: {
          backgroundColor: string;
          borderColor: string;
          borderWidth: string;
          borderStyle: string;
          borderRadius: string;
          textColor: string;
        };
        selectionCard: {
          backgroundColor: string;
          hoverBackgroundColor: string;
          borderColor: string;
          textColor: string;
          image?: string;
          badge?: string;
          badgeColor?: string;
        };
        chatBackdrop: {
          type: 'gradient' | 'pattern';
          gradient: string;
          pattern?: string;
          patternOpacity?: number;
          overlayColor?: string;
          textColor?: string;
        };
        icon?: string;
      };
      crisis_protocol: string;
      hotlines: Array<{
        name: string;
        contact: string;
        available?: string;
        info?: string;
      }>;
    };
  };
  tags: string[];
  created_at: string;
  updated_at: string;
};

export interface CreateAdvisorRequest {
  client_id: number;
  name: string;
  specialty: string;
  vibe: string;
}

export interface CreateAdvisorResponse {
  success: boolean;
  message: string;
  data?: {
    counselor_id: number;
    persona: PersonalityFromDB['profile'];
  };
}

export interface CustomAdvisor {
  id: number;
  name: string;
  specialty: string;
  description: string;
  created_at: string;
  profile?: PersonalityFromDB['profile'];
}

// Legacy type aliases for backward compatibility
export type Counselor = Personality;
export type CounselorFromDB = PersonalityFromDB;
