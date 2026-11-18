import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';

const Theme = () => {
  const { theme, accent, saveTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [accentColor, setAccentColor] = useState(accent);

  const themes = [
    {
      id: 'obsidian',
      name: 'Dark Mode (Obsidian)',
      desc: 'Optimized dark interface with Obsidian Black background, Deep Charcoal cards, and subtle borders.',
      colors: ['#0B0D10', '#12161C', '#3B82F6'],
    },
    {
      id: 'amber',
      name: 'Amber Mode (Warm Dark)',
      desc: 'Focused professional display with warm carbon surfaces and golden amber accents.',
      colors: ['#121212', '#1A1A1A', '#F59E0B'],
    },
    {
      id: 'ghost',
      name: 'Light Mode (Ghost)',
      desc: 'Clean Snow White layout with high contrast for bright environments.',
      colors: ['#F8FAFC', '#FFFFFF', '#2563EB'],
      light: true,
    },
  ];

  const accents = [
    {
      id: 'blue',
      name: 'Azure Blue',
      hex: '#3B82F6',
      desc: 'Official NexaSetu primary brand color',
    },
    {
      id: 'emerald',
      name: 'Emerald Green',
      hex: '#10B981',
      desc: 'Balanced engineering & growth accent',
    },
    {
      id: 'amber',
      name: 'Golden Amber',
      hex: '#F59E0B',
      desc: 'High-visibility warm accent',
    },
    {
      id: 'purple',
      name: 'Royal Purple',
      hex: '#A855F7',
      desc: 'Intelligence & creative accent',
    },
    {
      id: 'rose',
      name: 'Rose Pink',
      hex: '#F43F5E',
      desc: 'Modern vibrant accent',
    },
  ];

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-6 bg-background text-text min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="space-y-1 border-b border-border-subtle pb-4">
          <h1 className="text-xl font-bold tracking-tight text-text">
            Appearance settings
          </h1>
          <p className="text-sm text-text-subtle">
            Customize the theme and accent color for your NexaSetu workspace.
          </p>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-8">
          {/* 1. Theme Grid */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-text">
              Workspace theme
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themes.map((t) => {
                const isSelected = selectedTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTheme(t.id)}
                    className={`p-4 text-left rounded-lg border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary bg-background-elevated shadow-sm ring-1 ring-primary/40'
                        : 'border-border-subtle bg-card hover:bg-background-elevated/50'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex gap-1.5 p-1 rounded bg-background border border-border-subtler">
                          {t.colors.map((c, i) => (
                            <div
                              key={i}
                              className="w-3 h-3 rounded-xs"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        {isSelected && (
                          <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[11px] font-semibold text-primary">
                            Active
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-text mb-1">
                        {t.name}
                      </h3>
                      <p className="text-xs text-text-subtle leading-relaxed">
                        {t.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Accent Color Grid */}
          <section className="space-y-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-text">
                Accent color
              </h2>
              <p className="text-xs text-text-subtle">
                Personalizes highlights, active navigation markers, and interactive focus states.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {accents.map((acc) => {
                const isSelected = accentColor === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => setAccentColor(acc.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer text-left flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-primary bg-background-elevated ring-1 ring-primary/40'
                        : 'border-border-subtle bg-card hover:bg-background-elevated/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center border border-white/20"
                        style={{ backgroundColor: acc.hex }}
                      >
                        {isSelected && (
                          <Check size={12} className="text-white stroke-[3]" />
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-semibold text-primary">
                          Selected
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text">
                        {acc.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <footer className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row justify-end items-center gap-3">
          <button
            onClick={() => {
              setSelectedTheme(theme);
              setAccentColor(accent);
              toast.success('Appearance changes discarded.');
            }}
            className="w-full sm:w-auto h-9 px-4 rounded border border-border-subtle hover:bg-background-elevated text-xs font-medium text-text-subtle transition-all cursor-pointer"
          >
            Discard
          </button>
          <button
            onClick={() => {
              setSelectedTheme('obsidian');
              setAccentColor('blue');
              toast.success(
                'Default configuration selected. Click save to apply.'
              );
            }}
            className="w-full sm:w-auto h-9 px-4 rounded border border-border-subtle bg-background-elevated hover:bg-background-light text-xs font-medium text-text transition-all cursor-pointer"
          >
            Restore defaults
          </button>
          <button
            onClick={() => {
              saveTheme(selectedTheme, accentColor);
              toast.success('Appearance configuration saved successfully.');
              setTimeout(() => window.location.reload(), 600);
            }}
            className="w-full sm:w-auto h-9 px-5 rounded bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            Save theme
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Theme;
