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
