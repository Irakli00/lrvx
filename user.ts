export type TRoles = "admin" | "employee" | "hr";
export type TDate = {
  day: number;
  month: number;
  year: number;
};
export type TVisa = {
  issuing_country: string;
  type: string;
  start_date: number;
  end_date: number;
};
export type TManager = {
  id: string;
  first_name: string;
  last_name: string;
};

export type TUser = {
  _id: string;
  role: TRoles;
  isRemoteWork?: true;
  user_avatar?: string;
  first_name: string;
  last_name: string;
  first_native_name?: string;
  last_native_name?: string;
  middle_native_name?: string;
  department?: string;
  building?: string;
  room?: string;
  date_birth: TDate;
  desk_number?: string;
  manager?: TManager;
  phone: string;
  email: string;
  password: string;
  skype?: string;
  cnumber?: string;
  citizenship?: string;
  visa?: TVisa[];
};

export type TAuthenticatedUser = Partial<TUser> | null;
