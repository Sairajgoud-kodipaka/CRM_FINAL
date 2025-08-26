'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Edit } from 'lucide-react';

const profile = {
  name: 'Telecaller User',
  email: 'telecaller@example.com',
  phone: '9876543210',
  role: 'Telecaller',
};

export default function TelecallerProfilePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">My Profile</h1>
          <p className="text-text-secondary mt-1">View and update your profile information</p>
        </div>
        <Button className="btn-primary text-sm flex items-center gap-1"><Edit className="w-4 h-4" /> Edit Profile</Button>
      </div>
      <Card className="p-6 flex flex-col items-center gap-4 max-w-md mx-auto">
        <Avatar className="w-20 h-20 text-3xl">
          {profile.name[0]}
        </Avatar>
        <div className="text-xl font-bold text-text-primary">{profile.name}</div>
        <div className="text-text-secondary">{profile.role}</div>
        <div className="text-text-muted">{profile.email}</div>
        <div className="text-text-muted">{profile.phone}</div>
      </Card>
    </div>
  );
}