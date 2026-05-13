export interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  carModel: string;
  startDate: string;
}

export interface ParkingSlot {
  id: number;
  occupied: boolean;
  client?: Client;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending';
}