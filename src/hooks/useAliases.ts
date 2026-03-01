import { useState, useEffect } from 'react';

interface Alias {
  id: string;
  email: string;
  domain: string;
  createdAt: Date;
}

export const useAliases = () => {
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mockAliases: Alias[] = [
      {
        id: '1',
        email: 'phantom1@vantis-phantom.com',
        domain: 'vantis-phantom.com',
        createdAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        email: 'phantom2@vantis-phantom.com',
        domain: 'vantis-phantom.com',
        createdAt: new Date('2024-02-20'),
      },
      {
        id: '3',
        email: 'ghost@secure-mail.io',
        domain: 'secure-mail.io',
        createdAt: new Date('2024-03-10'),
      },
      {
        id: '4',
        email: 'shadow@encrypted-mail.net',
        domain: 'encrypted-mail.net',
        createdAt: new Date('2024-03-25'),
      },
    ];

    setTimeout(() => {
      setAliases(mockAliases);
      setIsLoading(false);
    }, 500);
  }, []);

  const createAlias = async (domain: string): Promise<Alias> => {
    const newAlias: Alias = {
      id: Date.now().toString(),
      email: `phantom${Date.now()}@${domain}`,
      domain,
      createdAt: new Date(),
    };

    setAliases((prev) => [...prev, newAlias]);
    return newAlias;
  };

  const deleteAlias = async (aliasId: string): Promise<void> => {
    setAliases((prev) => prev.filter((alias) => alias.id !== aliasId));
  };

  return {
    aliases,
    isLoading,
    createAlias,
    deleteAlias,
  };
};
