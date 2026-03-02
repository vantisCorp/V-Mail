import React from 'react';
import { useEmails } from '../hooks/useEmails';
import { useSearch } from '../hooks/useSearch';
import { useFilter } from '../hooks/useFilter';
import { useSort } from '../hooks/useSort';
import { usePagination } from '../hooks/usePagination';
import { SearchBar } from './SearchBar';
import { FilterBar } from './FilterBar';
import { SortBar } from './SortBar';
import { Pagination } from './Pagination';
import { Email } from '../types';

interface EmailListProps {
  onEmailSelect: (email: Email) => void;
  selectedEmailId: string | null;
}

export const EmailList: React.FC<EmailListProps> = ({
  onEmailSelect,
  selectedEmailId,
}) => {
  const { getFilteredEmails, markAsRead, toggleStar, deleteEmail } = useEmails();
  const emails = getFilteredEmails();

  const {
    searchQuery,
    filteredEmails: searchedEmails,
    resultCount,
    handleSearchChange,
    clearSearch,
  } = useSearch(emails);

  const {
    filters,
    filteredEmails: filteredEmails,
    activeFilterCount,
    toggleFilter,
    clearFilters,
  } = useFilter(searchedEmails);

  const {
    sortOptions,
    sortedEmails,
    setSortField,
  } = useSort(filteredEmails);

  const {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
  } = usePagination({
    totalItems: sortedEmails.length,
    itemsPerPage: 10,
  });

  const paginatedEmails = sortedEmails.slice(startIndex, endIndex);

  const handleEmailClick = (email: Email) => {
    onEmailSelect(email);
    if (!email.read) {
      markAsRead(email.id);
    }
  };

  const handleStarClick = (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    toggleStar(emailId);
  };

  const handleDeleteClick = (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this email?')) {
      deleteEmail(emailId);
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="email-list">
      <div className="email-list-header">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClear={clearSearch}
          resultCount={resultCount}
        />
        <div className="email-list-controls">
          <FilterBar
            activeFilterCount={activeFilterCount}
            onToggleFilter={toggleFilter}
            onClearFilters={clearFilters}
          />
          <SortBar
            sortField={sortOptions.field}
            sortOrder={sortOptions.order}
            onSortChange={setSortField}
          />
        </div>
      </div>

      <div className="email-list-content">
        {paginatedEmails.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No emails found</p>
          </div>
        ) : (
          <ul className="email-items">
            {paginatedEmails.map((email) => (
              <li
                key={email.id}
                className={`email-item ${!email.read ? 'unread' : ''} ${
                  selectedEmailId === email.id ? 'selected' : ''
                }`}
                onClick={() => handleEmailClick(email)}
              >
                <div className="email-item-header">
                  <div className="email-item-from">{email.from}</div>
                  <div className="email-item-date">{formatDate(email.date)}</div>
                </div>
                <div className="email-item-subject">{email.subject}</div>
                <div className="email-item-preview">
                  {email.body.substring(0, 100)}...
                </div>
                <div className="email-item-footer">
                  <div className="email-item-badges">
                    {email.encrypted && (
                      <span className="badge badge-encrypted" title="Encrypted">
                        🔒
                      </span>
                    )}
                    {email.hasAttachments && (
                      <span className="badge badge-attachment" title="Has attachments">
                        📎
                      </span>
                    )}
                    {email.phantomAlias && (
                      <span className="badge badge-phantom" title="Phantom alias">
                        👻
                      </span>
                    )}
                    {email.selfDestruct && (
                      <span className="badge badge-destruct" title="Self-destruct">
                        ⏰
                      </span>
                    )}
                  </div>
                  <div className="email-item-actions">
                    <button
                      className="action-btn star-btn"
                      onClick={(e) => handleStarClick(e, email.id)}
                      title={email.starred ? 'Unstar' : 'Star'}
                    >
                      {email.starred ? '⭐' : '☆'}
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={(e) => handleDeleteClick(e, email.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="email-list-footer">
          <Pagination
            totalItems={sortedEmails.length}
            currentPage={currentPage}
            onPageChange={goToPage}
          />
        </div>
      )}
    </div>
  );
};
