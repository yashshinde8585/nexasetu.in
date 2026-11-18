import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  Shield,
  ChevronLeft,
  X,
  SlidersHorizontal,
} from 'lucide-react';

const ITEMS_PER_PAGE = 7;

const UserDirectoryTab = ({
  data,
  currentPage,
  setCurrentPage,
  searchQuery,
  debouncedSearchQuery = '',
  setSearchQuery,
  setEditingUser,
}) => {
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState('ALL');

  const rawUsers = useMemo(() => {
    return Array.isArray(data?.users) ? data.users.filter(Boolean) : [];
  }, [data?.users]);

  // Extract available distinct roles for the filter
  const availableRoles = useMemo(() => {
    const rolesSet = new Set(rawUsers.map((u) => u.role).filter(Boolean));
    return Array.from(rolesSet);
  }, [rawUsers]);

  const { filteredUsers, paginatedUsers, totalPages, startIndex, endIndex } =
    useMemo(() => {
      const filtered = rawUsers.filter((u) => {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesSearch =
          (u?.name || '').toLowerCase().includes(query) ||
          (u?.email || '').toLowerCase().includes(query) ||
          (u?.role || '').toLowerCase().includes(query);

        const matchesRole =
          roleFilter === 'ALL' ||
          (u?.role || '').toUpperCase() === roleFilter.toUpperCase();

        return matchesSearch && matchesRole;
      });

      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const paginated = filtered.slice(start, end);
      const pages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

      return {
        filteredUsers: filtered,
        paginatedUsers: paginated,
        totalPages: pages || 1,
        startIndex: filtered.length > 0 ? start + 1 : 0,
        endIndex: Math.min(end, filtered.length),
      };
    }, [rawUsers, debouncedSearchQuery, roleFilter, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages, setCurrentPage]);

  const paginationRange = useMemo(() => {
    const range = [];
    const delta = 1;

    range.push(1);

    if (currentPage > delta + 2) {
      range.push('...');
    }

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (currentPage < totalPages - delta - 1) {
      range.push('...');
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="bg-card border border-border-subtle rounded-sm p-4 sm:p-5 flex flex-col gap-4 animate-fade-in">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative group flex-1 min-w-[200px] max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtler group-focus-within:text-primary transition-colors"
              size={14}
            />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 pl-9 pr-8 text-xs text-text focus:border-primary/50 outline-none transition-all placeholder:text-text-subtler font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtler hover:text-text cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Role Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal size={13} className="text-text-subtler" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-2.5 bg-background-elevated border border-border-subtle rounded-xs text-xs font-medium text-text focus:border-primary/50 outline-none cursor-pointer"
            >
              <option value="ALL">All roles</option>
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side: Role management navigation & total user count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-xs text-text-subtler font-medium">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </span>
          <button
            onClick={() => navigate('/settings?tab=roles')}
            className="h-9 px-3 bg-background-elevated border border-border-subtle hover:border-border text-xs font-semibold text-text rounded-xs transition-all flex items-center gap-1.5 cursor-pointer hover:bg-background-elevated/80"
          >
            <Shield size={13} className="text-primary" />
            <span className="hidden md:inline">Manage roles & permissions</span>
            <span className="md:hidden">Roles</span>
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="text-text-subtle text-xs font-medium border-b border-border-subtle bg-background-elevated/40 select-none">
              <th className="py-2.5 px-3">User</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/50 text-[13px] font-normal">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((u, idx) => {
                const userId = u.id || u._id || u.email || `user-${idx}`;
                const userName = u.name || 'Unknown';
                const userEmail = u.email || '';
                const userRole = u.role || 'DEVELOPER';
                const userStatus = u.status || 'Active';

                return (
                  <tr
                    key={userId}
                    className="hover:bg-background-elevated/30 transition-colors group cursor-default"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xs bg-background-elevated border border-border-subtle flex items-center justify-center text-xs font-bold text-text uppercase shrink-0">
                          {userName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-text group-hover:text-primary transition-colors">
                            {userName}
                          </span>
                          <span className="text-xs text-text-subtle font-normal">
                            {userEmail}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-xs bg-background-elevated border border-border-subtle text-text-subtle">
                        {userRole.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-xs font-medium ${
                            userStatus === 'Active'
                              ? 'bg-status-success/10 border border-status-success/20 text-status-success'
                              : 'bg-status-error/10 border border-status-error/20 text-status-error'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              userStatus === 'Active'
                                ? 'bg-status-success'
                                : 'bg-status-error'
                            }`}
                          />
                          {userStatus}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setEditingUser(u)}
                        title="Edit user role & access"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-background-elevated border border-border-subtle hover:border-primary/40 hover:text-primary rounded-xs transition-colors cursor-pointer text-text"
                      >
                        <Shield size={12} className="text-primary" />
                        <span>Edit role</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="py-12 text-center text-sm font-medium text-text-subtler"
                >
                  No users matched your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredUsers.length > ITEMS_PER_PAGE && (
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border-subtle text-xs font-medium text-text-subtle">
          <span>
            Showing {startIndex}–{endIndex} of {filteredUsers.length} users
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-xs bg-background-elevated border border-border-subtle text-text-subtle hover:text-text disabled:opacity-25 transition-colors cursor-pointer"
            >
              <ChevronLeft size={13} />
            </button>
            <div className="flex gap-1 px-1">
              {paginationRange.map((pageNumber, pageIdx) => {
                if (pageNumber === '...') {
                  return (
                    <span
                      key={`dots-${pageIdx}`}
                      className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-text-subtler"
                    >
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={`page-${pageNumber}`}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-7 h-7 rounded-xs text-xs font-semibold transition-all cursor-pointer ${
                      currentPage === pageNumber
                        ? 'bg-primary text-black font-semibold'
                        : 'bg-background-elevated border border-border-subtle text-text-subtle hover:text-text'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className="p-1.5 rounded-xs bg-background-elevated border border-border-subtle text-text-subtle hover:text-text disabled:opacity-25 transition-colors cursor-pointer"
            >
              <ChevronLeft size={13} className="rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDirectoryTab;
