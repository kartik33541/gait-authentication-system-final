import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Trash2, Shield, Mail } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import toast from 'react-hot-toast';

/**
 * StepAddPersons Component (Step 2)
 * Manages authorized personnel vaults up to 15 nodes.
 * @param {object} props
 * @param {Array} props.persons
 * @param {function} props.onUpdatePersons
 * @param {function} props.onBack
 * @param {function} props.onNext
 */
export const StepAddPersons = ({ persons = [], onUpdatePersons, onBack, onNext }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const handleAddPerson = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !role.trim()) {
      toast.error("Please provide Name, Role, and Corporate Email.");
      return;
    }
    if (persons.length >= 15) {
      toast.error("Maximum node limit (15 personnel) reached for standard organization perimeters.");
      return;
    }
    const newPerson = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      email,
      role,
      avatar: name.charAt(0).toUpperCase(),
      readings: [
        { id: 1, duration: '60s', status: 'pending' },
        { id: 2, duration: '60s', status: 'pending' },
        { id: 3, duration: '60s', status: 'pending' },
        { id: 4, duration: '60s', status: 'pending' },
        { id: 5, duration: '60s', status: 'pending' },
      ],
      enrollmentStatus: 'pending'
    };
    onUpdatePersons([...persons, newPerson]);
    setName('');
    setEmail('');
    setRole('');
    toast.success(`${name} registered into perimeter queue.`);
  };

  const handleRemovePerson = (id) => {
    onUpdatePersons(persons.filter(p => p.id !== id));
    toast("Node removed from perimeter pool.");
  };

  const handleProceed = () => {
    if (persons.length === 0) {
      toast.error("Add at least one authorized personnel node before starting biometric capture.");
      return;
    }
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <GlassPanel className="p-8 border-[--border-strong] shadow-lg">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[--border-subtle]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[--bg-elevated-2] rounded-[var(--radius-md)] border border-[--border-subtle]">
              <Users className="w-6 h-6 text-[--accent-violet]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[--text-primary]">Register Authorized Personnel</h2>
              <p className="text-xs text-[--text-secondary]">Define up to 15 team members allowed within this zero-trust perimeter.</p>
            </div>
          </div>
          <Badge variant={persons.length > 0 ? 'info' : 'neutral'} className="font-mono text-xs">
            {persons.length} / 15 NODES
          </Badge>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAddPerson} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <Input
            placeholder="Full Name (e.g., Alex Mercer)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            placeholder="Corporate Email"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Input
              placeholder="Role / Clearance"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" variant="primary" size="md" icon={UserPlus} className="shrink-0 font-semibold px-4">
              Add
            </Button>
          </div>
        </form>
      </GlassPanel>

      {/* Personnel List */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase text-[--text-secondary] font-semibold tracking-wider px-2">
          Registered Perimeter Queue ({persons.length})
        </h3>

        {persons.length === 0 ? (
          <GlassPanel className="py-12 text-center border-[--border-subtle]/60 bg-[--bg-elevated-2]/40 text-[--text-muted]">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30 text-[--accent-indigo]" />
            <p className="text-sm font-medium">No personnel enrolled yet.</p>
            <p className="text-xs">Add your first employee node above to begin capturing kinetic walk readings.</p>
          </GlassPanel>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {persons.map((person) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-[--bg-elevated-2] border border-[--border-subtle] hover:border-[--border-strong] rounded-[var(--radius-md)] p-4 flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center gap-3.5 truncate pr-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6366F1] via-[#9B6BFF] to-[#EC4899] p-0.5 shrink-0 flex items-center justify-center font-bold text-sm text-white">
                      <div className="w-full h-full bg-[--bg-primary] rounded-full flex items-center justify-center">
                        {person.avatar || "U"}
                      </div>
                    </div>
                    <div className="truncate">
                      <h4 className="font-semibold text-sm text-[--text-primary] truncate">{person.name}</h4>
                      <p className="text-micro font-mono text-[--text-muted] truncate">{person.role} • {person.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="warning" className="text-[10px] px-2.5">Pending Capture</Badge>
                    <button
                      type="button"
                      onClick={() => handleRemovePerson(person.id)}
                      aria-label="Remove person"
                      className="p-1.5 text-[--text-muted] hover:text-[--accent-danger] rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Footer Controls */}
      <div className="pt-6 border-t border-[--border-subtle]/50 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="font-medium">
          ← Back to Profile
        </Button>
        <Button variant="primary" size="lg" onClick={handleProceed} className="font-semibold px-8">
          Next: Biometric Enrollment Studio →
        </Button>
      </div>
    </div>
  );
};

export default StepAddPersons;
