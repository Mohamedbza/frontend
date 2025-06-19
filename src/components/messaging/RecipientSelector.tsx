'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiBriefcase, FiX, FiUserPlus, FiUsers, FiSearch, FiChevronDown } from 'react-icons/fi';
import { useTheme } from '@/app/context/ThemeContext';
import { Participant } from '@/types';
import useMessagingStore from '@/store/useMessagingStore';

interface RecipientSelectorProps {
  selectedRecipients: Participant[];
  onAddRecipient: (recipient: Participant) => void;
  onRemoveRecipient: (recipientId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxRecipients?: number;
  allowedTypes?: Array<'candidate' | 'employer' | 'admin' | 'consultant'>;
}

const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  selectedRecipients,
  onAddRecipient,
  onRemoveRecipient,
  placeholder = 'Add recipients...',
  disabled = false,
  maxRecipients = 10,
  allowedTypes = ['candidate', 'employer', 'admin', 'consultant'],
}) => {
  const { colors, theme } = useTheme();
  const { 
    fetchAvailableRecipients,
    isLoadingRecipients, 
    recipientsError,
    suggestedRecipients
  } = useMessagingStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Participant[]>([]);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
  const [recentRecipients, setRecentRecipients] = useState<Participant[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Fetch recipients if needed
  useEffect(() => {
    if (suggestedRecipients.length === 0 && !isLoadingRecipients) {
      fetchAvailableRecipients();
    }
  }, [suggestedRecipients.length, isLoadingRecipients, fetchAvailableRecipients]);

  // Filter suggestions based on search term and allowed types
  useEffect(() => {
    // Start with all available recipients filtered by allowed types
    let filtered = suggestedRecipients.filter(recipient => 
      allowedTypes.includes(recipient.type as 'candidate' | 'employer' | 'admin' | 'consultant')
    );
    
    // Apply search term filter if any
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(recipient => 
        recipient.name.toLowerCase().includes(term)
      );
    }
    
    // Apply type filter if active
    if (activeTypeFilter) {
      filtered = filtered.filter(recipient => 
        recipient.type === activeTypeFilter
      );
    }
    
    // Filter out already selected recipients
    filtered = filtered.filter(recipient => 
      !selectedRecipients.some(selected => selected.id === recipient.id)
    );
    
    // If no search term, use recentRecipients if we have them
    if (!searchTerm.trim() && recentRecipients.length > 0) {
      setFilteredSuggestions(recentRecipients.filter(recipient => 
        !selectedRecipients.some(selected => selected.id === recipient.id)
      ));
      return;
    }
    
    setFilteredSuggestions(filtered);
  }, [searchTerm, suggestedRecipients, selectedRecipients, allowedTypes, activeTypeFilter, recentRecipients]);

  // Initialize recent recipients from all available recipients
  useEffect(() => {
    if (suggestedRecipients.length > 0 && recentRecipients.length === 0) {
      // Create a simple "recent recipients" list based on available recipients
      // In real app this would come from actual usage history
      const recentItems: Participant[] = [];
      
      // Get a sample of each type if available
      allowedTypes.forEach(type => {
        const typeRecipients = suggestedRecipients.filter(r => r.type === type);
        if (typeRecipients.length > 0) {
          recentItems.push(...typeRecipients.slice(0, 2));
        }
      });
      
      setRecentRecipients(recentItems.slice(0, 5));
    }
  }, [suggestedRecipients, recentRecipients.length, allowedTypes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input focus
  const handleFocus = () => {
    setShowDropdown(true);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!showDropdown) {
      setShowDropdown(true);
    }
  };

  // Add recipient and clear search
  const handleAddRecipient = (recipient: Participant) => {
    onAddRecipient(recipient);
    setSearchTerm('');
    // Focus the input after selection
    inputRef.current?.focus();
  };

  // Filter by participant type
  const handleTypeFilter = (type: string | null) => {
    setActiveTypeFilter(type);
  };

  // Get background color for recipient chip based on type
  const getRecipientChipColor = (type: string) => {
    switch (type) {
      case 'candidate':
        return theme === 'light' ? `${colors.primary}15` : `${colors.primary}30`;
      case 'employer':
        return theme === 'light' ? `${colors.secondary}15` : `${colors.secondary}30`;
      case 'admin':
        return theme === 'light' ? '#6366F115' : '#6366F130';
      case 'consultant':
        return theme === 'light' ? '#F59E0B15' : '#F59E0B30';
      default:
        return theme === 'light' ? '#E2E8F0' : '#334155';
    }
  };

  // Get text color for recipient chip based on type
  const getRecipientChipTextColor = (type: string) => {
    switch (type) {
      case 'candidate':
        return colors.primary;
      case 'employer':
        return colors.secondary;
      case 'admin':
        return '#6366F1';
      case 'consultant':
        return '#F59E0B';
      default:
        return colors.text;
    }
  };

  // Get icon based on participant type
  const getParticipantIcon = (type: string) => {
    switch (type) {
      case 'candidate':
        return <FiUser className="w-4 h-4" />;
      case 'employer':
        return <FiBriefcase className="w-4 h-4" />;
      case 'admin':
        return <FiUserPlus className="w-4 h-4" />;
      case 'consultant':
        return <FiUsers className="w-4 h-4" />;
      default:
        return <FiUser className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="flex flex-wrap items-center gap-2 p-3 border rounded-lg transition-all duration-200"
        style={{
          backgroundColor: disabled ? (theme === 'light' ? '#F3F4F6' : '#374151') : colors.background,
          borderColor: showDropdown ? colors.primary : colors.border,
          boxShadow: showDropdown ? `0 0 0 2px ${colors.primary}20` : 'none',
          cursor: disabled ? 'not-allowed' : 'text'
        }}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
          }
        }}
      >
        {/* Selected Recipients */}
        {selectedRecipients.map(recipient => (
          <div 
            key={recipient.id}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md border"
            style={{ 
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text
            }}
          >
            <div className="w-4 h-4 rounded flex items-center justify-center text-white text-xs" style={{ backgroundColor: getRecipientChipTextColor(recipient.type) }}>
              {getParticipantIcon(recipient.type)}
            </div>
            <span className="text-xs font-medium">{recipient.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{
              backgroundColor: `${getRecipientChipTextColor(recipient.type)}15`,
              color: getRecipientChipTextColor(recipient.type)
            }}>
              {recipient.type}
            </span>
            {!disabled && (
              <button
                type="button"
                className="rounded-full p-0.5 transition-all duration-200 hover:opacity-80"
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => onRemoveRecipient(recipient.id)}
                aria-label={`Remove ${recipient.name}`}
              >
                <FiX className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
        
        {/* Input Field */}
        {selectedRecipients.length < maxRecipients && !disabled && (
          <input
            ref={inputRef}
            type="text"
            className="flex-1 min-w-[150px] py-1 px-2 outline-none bg-transparent text-sm"
            style={{ color: colors.text }}
            placeholder={selectedRecipients.length === 0 ? placeholder : 'Add more...'}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleFocus}
            disabled={disabled}
          />
        )}
      </div>
      
      {/* Dropdown Menu */}
      <AnimatePresence>
        {showDropdown && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute z-10 w-full mt-1 py-2 rounded-lg border shadow-lg overflow-hidden"
            style={{ 
              backgroundColor: colors.card,
              borderColor: colors.border,
              maxHeight: '300px', 
              overflowY: 'auto',
              boxShadow: theme === 'light' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Type Filters */}
            <div className="px-3 mb-2 flex gap-1 overflow-x-auto pb-1">
              <button
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap font-medium transition-all duration-200 ${
                  activeTypeFilter !== null ? 'hover:bg-opacity-80' : ''
                }`}
                style={{
                  backgroundColor: activeTypeFilter === null ? colors.primary : `${colors.primary}10`,
                  color: activeTypeFilter === null ? '#FFFFFF' : colors.primary
                }}
                onClick={() => handleTypeFilter(null)}
              >
                All Types
              </button>
              {allowedTypes.includes('candidate') && (
                <button
                  className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 whitespace-nowrap font-medium transition-all duration-200 hover:bg-opacity-80`}
                  style={{
                    backgroundColor: activeTypeFilter === 'candidate' ? colors.primary : `${colors.primary}10`,
                    color: activeTypeFilter === 'candidate' ? '#FFFFFF' : colors.primary
                  }}
                  onClick={() => handleTypeFilter('candidate')}
                >
                  <FiUser className="w-3.5 h-3.5" />
                  Candidates
                </button>
              )}
              {allowedTypes.includes('employer') && (
                <button
                  className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 whitespace-nowrap font-medium transition-all duration-200 hover:bg-opacity-80`}
                  style={{
                    backgroundColor: activeTypeFilter === 'employer' ? colors.primary : `${colors.primary}10`,
                    color: activeTypeFilter === 'employer' ? '#FFFFFF' : colors.primary
                  }}
                  onClick={() => handleTypeFilter('employer')}
                >
                  <FiBriefcase className="w-3.5 h-3.5" />
                  Companies
                </button>
              )}
              {allowedTypes.includes('admin') && (
                <button
                  className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 whitespace-nowrap font-medium transition-all duration-200 hover:bg-opacity-80`}
                  style={{
                    backgroundColor: activeTypeFilter === 'admin' ? colors.primary : `${colors.primary}10`,
                    color: activeTypeFilter === 'admin' ? '#FFFFFF' : colors.primary
                  }}
                  onClick={() => handleTypeFilter('admin')}
                >
                  <FiUserPlus className="w-3.5 h-3.5" />
                  Team
                </button>
              )}
              {allowedTypes.includes('consultant') && (
                <button
                  className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 whitespace-nowrap font-medium transition-all duration-200 hover:bg-opacity-80`}
                  style={{
                    backgroundColor: activeTypeFilter === 'consultant' ? colors.primary : `${colors.primary}10`,
                    color: activeTypeFilter === 'consultant' ? '#FFFFFF' : colors.primary
                  }}
                  onClick={() => handleTypeFilter('consultant')}
                >
                  <FiUsers className="w-3.5 h-3.5" />
                  Consultants
                </button>
              )}
            </div>
            
            {/* Search Status */}
            {searchTerm && (
              <div className="px-3 py-2 text-xs flex items-center gap-2 border-b" style={{ color: `${colors.text}80`, borderColor: colors.border }}>
                <FiSearch className="w-3.5 h-3.5" />
                <span>Searching for "{searchTerm}"</span>
              </div>
            )}
            
            {/* Section Headers and Suggestions */}
            {!searchTerm && recentRecipients.length > 0 && filteredSuggestions.length > 0 && (
              <div className="mt-1">
                <div className="px-3 py-1.5 text-xs font-medium" style={{ color: `${colors.text}80` }}>
                  Recent Contacts
                </div>
                {filteredSuggestions.map(recipient => (
                  <div
                    key={recipient.id}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-3 rounded-md transition-all duration-200 hover:bg-opacity-5`}
                    style={{ 
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.primary}05`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => handleAddRecipient(recipient)}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: getRecipientChipTextColor(recipient.type),
                        color: 'white'
                      }}
                    >
                      {getParticipantIcon(recipient.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm" style={{ color: colors.text }}>{recipient.name}</div>
                      <div className="text-xs capitalize" style={{ color: `${colors.text}60` }}>{recipient.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Search Results */}
            {searchTerm && filteredSuggestions.length > 0 && (
              <div className="mt-1">
                <div className="px-3 py-1.5 text-xs font-medium" style={{ color: `${colors.text}80` }}>
                  Search Results
                </div>
                {filteredSuggestions.map(recipient => (
                  <div
                    key={recipient.id}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-3 rounded-md transition-all duration-200 hover:bg-opacity-5`}
                    style={{ 
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.primary}05`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => handleAddRecipient(recipient)}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: getRecipientChipTextColor(recipient.type),
                        color: 'white'
                      }}
                    >
                      {getParticipantIcon(recipient.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm" style={{ color: colors.text }}>{recipient.name}</div>
                      <div className="text-xs capitalize" style={{ color: `${colors.text}60` }}>{recipient.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Empty State */}
            {filteredSuggestions.length === 0 && (
              <div className="px-3 py-4 text-center text-sm" style={{ color: `${colors.text}80` }}>
                {isLoadingRecipients ? (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading contacts...</span>
                  </div>
                ) : recipientsError ? (
                  <div>
                    <div className="text-red-500 dark:text-red-400 mb-2">
                      Error loading contacts
                    </div>
                    <div className="text-xs">
                      {recipientsError.includes('mock') ? 
                        'Using mock data due to API issues' : 
                        'Please try again later'}
                    </div>
                  </div>
                ) : (
                  searchTerm ? 'No matching contacts found' : 'No recent contacts'
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecipientSelector;