export interface ChatBackdrop {
  type: 'gradient' | 'pattern';
  gradient: string;
  pattern?: string;
  patternOpacity?: number;
  overlayColor?: string;
}

export interface Counselor {
  id: number;
  name: string;
  description: string;
  specialty: string;
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
    };
    chatBackdrop: ChatBackdrop;
    icon?: string;
  };
}

export type CounselorFromDB = {
  id: number;
  name: string;
  specialization: string;  // now stores 'who_you_are'
  therapeutic_style: string;  // now stores 'your_vibe'
  credentials: string;  // now stores 'your_worldview'
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
        };
        chatBackdrop: {
          type: 'gradient' | 'pattern';
          gradient: string;
          pattern?: string;
          patternOpacity?: number;
          overlayColor?: string;
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
