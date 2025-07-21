'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Users, 
  School, 
  BookOpen, 
  FileText, 
  User,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'user' | 'school' | 'subject' | 'assignment' | 'section';
  title: string;
  description: string;
  url: string;
  metadata?: Record<string, any>;
}

const getResultIcon = (type: SearchResult['type']) => {
  switch (type) {
    case 'user':
      return <User className="w-4 h-4" />;
    case 'school':
      return <School className="w-4 h-4" />;
    case 'subject':
      return <BookOpen className="w-4 h-4" />;
    case 'assignment':
      return <FileText className="w-4 h-4" />;
    case 'section':
      return <Users className="w-4 h-4" />;
    default:
      return <Search className="w-4 h-4" />;
  }
};

const getResultTypeLabel = (type: SearchResult['type']) => {
  switch (type) {
    case 'user':
      return 'User';
    case 'school':
      return 'School';
    case 'subject':
      return 'Subject';
    case 'assignment':
      return 'Assignment';
    case 'section':
      return 'Section';
    default:
      return 'Result';
  }
};

interface SearchResultItemProps {
  result: SearchResult;
  onNavigate: (url: string) => void;
}

function SearchResultItem({ result, onNavigate }: SearchResultItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4" onClick={() => onNavigate(result.url)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {getResultIcon(result.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {result.title}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {getResultTypeLabel(result.type)}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2">
                {result.description}
              </p>
              
              {result.metadata && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(result.metadata).map(([key, value]) => (
                    <span key={key} className="text-xs text-gray-500">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = searchParams.get('q') || '';

  useEffect(() => {
    setSearchQuery(query);
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again.');
      
      // Mock results for demonstration
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'user',
          title: `Users matching "${searchTerm}"`,
          description: 'Search results for users in the system',
          url: `/users?search=${encodeURIComponent(searchTerm)}`,
          metadata: { role: 'Various' }
        },
        {
          id: '2',
          type: 'school',
          title: `Schools matching "${searchTerm}"`,
          description: 'Search results for schools in the system',
          url: `/schools?search=${encodeURIComponent(searchTerm)}`,
          metadata: { type: 'Educational Institution' }
        },
        {
          id: '3',
          type: 'subject',
          title: `Subjects matching "${searchTerm}"`,
          description: 'Search results for subjects in the system',
          url: `/subjects?search=${encodeURIComponent(searchTerm)}`,
          metadata: { category: 'Academic' }
        }
      ];
      setResults(mockResults);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const handleNavigate = (url: string) => {
    window.location.href = url;
  };

  const resultsByType = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Search Results" 
        subtitle={query ? `Results for "${query}"` : 'Enter a search term'} 
      />
      
      <main className="max-w-4xl mx-auto p-6">
        {/* Search form */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users, schools, subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Searching...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-center py-4">
                <p className="text-red-600">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {!isLoading && !error && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </h2>
            </div>

            {Object.entries(resultsByType).map(([type, typeResults]) => (
              <div key={type}>
                <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                  {getResultIcon(type as SearchResult['type'])}
                  <span className="ml-2">{getResultTypeLabel(type as SearchResult['type'])}</span>
                  <Badge variant="outline" className="ml-2">
                    {typeResults.length}
                  </Badge>
                </h3>
                
                <div className="space-y-3">
                  {typeResults.map((result) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!isLoading && !error && query && results.length === 0 && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find anything matching "{query}". Try adjusting your search terms.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>Try:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Using different keywords</li>
                    <li>Checking for typos</li>
                    <li>Using more general terms</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !error && !query && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start searching
                </h3>
                <p className="text-gray-600">
                  Enter a search term to find users, schools, subjects, and more.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}