import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';

const VoterCards = ({ voters, onVoterChange, colourRounds }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <User className="w-5 h-5" />
        Voter Details
      </h3>
      <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto pr-2">
        {voters.map((voter, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                {index + 1}
              </div>
              <span className="font-medium text-gray-700">Voter {index + 1}</span>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4 space-y-1">
                <Label htmlFor={`voter-name-${index}`} className="text-xs">Name</Label>
                <Input
                  id={`voter-name-${index}`}
                  placeholder="Full name"
                  value={voter.name}
                  onChange={(e) => onVoterChange(index, 'name', e.target.value)}
                  className="h-10 bg-white"
                />
              </div>
              <div className="col-span-12 md:col-span-4 space-y-1">
                <Label htmlFor={`voter-mobile-${index}`} className="text-xs">Mobile Number</Label>
                <Input
                  id={`voter-mobile-${index}`}
                  type="tel"
                  placeholder="Mobile"
                  value={voter.mobileNumber || ''}
                  onChange={(e) => onVoterChange(index, 'mobileNumber', e.target.value)}
                  className="h-10 bg-white"
                />
              </div>
              <div className="col-span-12 md:col-span-4 space-y-1">
                <Label htmlFor={`voter-epic-${index}`} className="text-xs">EPIC No</Label>
                <Input
                  id={`voter-epic-${index}`}
                  placeholder="EPIC No"
                  value={voter.epicNo || ''}
                  onChange={(e) => onVoterChange(index, 'epicNo', e.target.value)}
                  className="h-10 bg-white"
                />
              </div>
              <div className="col-span-6 md:col-span-6 space-y-1">
                <Label htmlFor={`voter-age-${index}`} className="text-xs">Age</Label>
                <Input
                  id={`voter-age-${index}`}
                  type="number"
                  placeholder="Age"
                  value={voter.age}
                  onChange={(e) => onVoterChange(index, 'age', e.target.value)}
                  className="h-10 bg-white"
                />
              </div>
              <div className="col-span-6 md:col-span-6 space-y-1">
                <Label htmlFor={`voter-colour-${index}`} className="text-xs">Colour Round</Label>
                <Select
                  value={voter.colourRound}
                  onValueChange={(value) => onVoterChange(index, 'colourRound', value)}
                >
                  <SelectTrigger className="h-10 bg-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {colourRounds.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color.color}`}></div>
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VoterCards;