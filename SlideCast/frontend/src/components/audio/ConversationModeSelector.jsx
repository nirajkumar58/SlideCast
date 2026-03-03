import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';

const modes = [
  {
    id: 'overview',
    title: 'Deep Dive Overview',
    description: 'A comprehensive discussion of the entire presentation with rich context and examples.',
    duration: '10-15 minutes'
  },
  {
    id: 'per-slide',
    title: 'Per Slide Explanations',
    description: 'Listen to each slide explained individually with detailed context.',
    duration: '1-2 minutes per slide'
  },
  {
    id: 'summary',
    title: 'Quick Summary',
    description: 'Get a concise overview of the key points and takeaways.',
    duration: '3-5 minutes'
  }
];

const ConversationModeSelector = ({ onModeSelect, selectedMode }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Select Audio Mode</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
              selectedMode === mode.id
                ? 'ring-2 ring-primary border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onModeSelect(mode.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{mode.title}</CardTitle>
              <CardDescription>{mode.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Duration: {mode.duration}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-6">
        <Button
          onClick={() => onModeSelect(selectedMode)}
          disabled={!selectedMode}
          className="w-full md:w-auto px-8 py-2 transition-all duration-200"
          variant="default"
          size="lg"
        >
          Continue with {selectedMode ? modes.find(m => m.id === selectedMode)?.title : 'selected mode'}
        </Button>
      </div>
    </div>
  );
};

export default ConversationModeSelector;
