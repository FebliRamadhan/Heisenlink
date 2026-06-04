export interface User {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
}

export interface ShortLink {
    id: string;
    code: string;
    destinationUrl: string;
    title?: string;
    clickCount: number;
    expiresAt?: string;
    isActive: boolean;
    hasPassword?: boolean;
    createdAt: string;
    shortUrl: string;
}

export interface BioPage {
    id: string;
    slug: string;
    title: string;
    bio?: string;
    avatarUrl?: string;
    theme: string;
    isPublished: boolean;
    links: BioLink[];
    socialLinks?: Record<string, string>;
}

export interface BioLink {
    id: string;
    title: string;
    url: string;
    icon?: string;
    position: number;
    isVisible: boolean;
    clickCount: number;
}

// ===========================================
// Forms
// ===========================================

export type QuestionType =
    | 'SHORT_TEXT'
    | 'LONG_TEXT'
    | 'MULTIPLE_CHOICE'
    | 'CHECKBOXES'
    | 'DROPDOWN'
    | 'LINEAR_SCALE'
    | 'DATE'
    | 'TIME'
    | 'FILE_UPLOAD'
    | 'SECTION'
    | 'STATEMENT'
    | 'IMAGE';

export interface QuestionOption {
    id: string;
    label: string;
}

export interface QuestionConfig {
    maxLength?: number;
    min?: number;
    max?: number;
    minLabel?: string;
    maxLabel?: string;
    allowFuture?: boolean;
    accept?: string[];
    maxSizeMb?: number;
    maxFiles?: number;
    imageUrl?: string;
    alt?: string;
}

export interface FormQuestion {
    id: string;
    type: QuestionType;
    title: string;
    description?: string | null;
    position: number;
    isRequired: boolean;
    options?: QuestionOption[] | null;
    config?: QuestionConfig | null;
}

export interface Form {
    id: string;
    slug: string;
    url: string;
    title: string;
    description?: string | null;
    theme: string;
    isPublished: boolean;
    acceptingResponses: boolean;
    collectEmail: boolean;
    oneResponsePerSession: boolean;
    closesAt?: string | null;
    confirmationMessage?: string | null;
    closedMessage?: string | null;
    responseCount: number;
    questionCount?: number;
    questions?: FormQuestion[];
    createdAt: string;
    updatedAt: string;
}

export interface PublicForm {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    theme: string;
    collectEmail: boolean;
    acceptingResponses: boolean;
    closesAt?: string | null;
    confirmationMessage?: string | null;
    closedMessage?: string | null;
    questions: FormQuestion[];
}

export interface FormAnswerInput {
    questionId: string;
    value: unknown;
}

export interface UploadedFileRef {
    url: string;
    name: string;
    size: number;
    mime: string;
}
