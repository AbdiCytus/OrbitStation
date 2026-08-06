export type SettingsProfile = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  bannerUrl: string | null;
  titleBadge: string | null;
  callsign: string | null;
  animationEnabled: boolean;
  hologramEnabled: boolean;
  allowFriendRequests?: boolean;
  staticBackgroundEnabled?: boolean;
  notifSoundEnabled?: boolean;
  notifSoundUrl?: string | null;
  saveFilterSortEnabled?: boolean;
  shortcuts?: string | null;
  station: { isPublic: boolean } | null;
  hasPassword?: boolean;
};

export type SettingsShortcuts = {
  myStation: string;
  publicStation: string;
  friends: string;
  analytics: string;
  settings: string;
};

export type FormErrors = {
  name?: string;
  username?: string;
  confirmPassword?: string;
};
