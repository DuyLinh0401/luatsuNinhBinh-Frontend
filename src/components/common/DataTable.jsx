import React, { useState, useEffect, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const DataTable = ({
  data = [],
  columns,
  title,
  onAdd,
  onEdit,
  onDelete,
  onView,
  searchFields = [],
  itemsPerPageOptions = [5, 10, 20, 50, 100],
  defaultItemsPerPage = 10,
  actions = ['edit', 'delete'],
  customActions = [],
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Lọc dữ liệu
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(data);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = data.filter(item => {
      if (searchFields.length === 0) {
        return Object.values(item).some(value =>
          value && value.toString().toLowerCase().includes(term)
        );
      }
      return searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      });
    });
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, data, searchFields]);

  // Sắp xếp dữ liệu
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (aVal === undefined || bVal === undefined) return 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [filteredData, sortField, sortDirection]);

  // Phân trang
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  // Hiển thị loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FCFBF9]">
        {title && <h2 className="text-lg font-bold text-navy-950 tracking-wide">{title}</h2>}
        
        <div className="flex flex-col sm:flex-row gap-3 ml-auto w-full sm:w-auto">
          {/* Tìm kiếm */}
          <div className="relative flex-1 sm:w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm kiếm dữ liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#C8992B]/40 focus:border-[#C8992B] w-full text-xs font-normal outline-none transition-all"
            />
          </div>
          
          {/* Nút thêm */}
          {onAdd && (
            <button
              onClick={onAdd}
              className="bg-navy-950 text-[#E2B649] hover:bg-[#C8992B] hover:text-navy-950 px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider shadow-sm shrink-0"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Thêm mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-[#F8F6F0]">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable !== false && handleSort(col.field)}
                  className={`px-6 py-3.5 text-left text-[11px] font-bold text-navy-950 uppercase tracking-wider ${
                    col.sortable !== false ? 'cursor-pointer hover:text-[#C8992B]' : ''
                  }`}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable !== false && sortField === col.field && (
                      <span className="text-[#C8992B]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
              {(actions.length > 0 || customActions.length > 0) && (
                <th className="px-6 py-3.5 text-right text-[11px] font-bold text-navy-950 uppercase tracking-wider">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-stone-50/80 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-xs text-slate-700 font-normal">
                      {col.render ? col.render(row[col.field], row) : row[col.field] || '-'}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-sm space-x-2 whitespace-nowrap">
                    {onView && (
                      <button
                        onClick={() => onView(row)}
                        className="text-green-600 hover:text-green-800"
                        title="Xem chi tiết"
                      >
                        <EyeIcon className="w-5 h-5 inline" />
                      </button>
                    )}
                    {actions.includes('edit') && onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Sửa"
                      >
                        <PencilIcon className="w-5 h-5 inline" />
                      </button>
                    )}
                    {actions.includes('delete') && onDelete && (
                      <button
                        onClick={() => onDelete(row.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Xóa"
                      >
                        <TrashIcon className="w-5 h-5 inline" />
                      </button>
                    )}
                    {customActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => action.onClick(row)}
                        className={action.className}
                        title={action.title}
                      >
                        {action.icon}
                      </button>
                    ))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Không có dữ liệu'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Hiển thị</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {itemsPerPageOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span>trên {sortedData.length} bản ghi</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Đầu
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-1 text-sm">
              Trang {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Cuối
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;