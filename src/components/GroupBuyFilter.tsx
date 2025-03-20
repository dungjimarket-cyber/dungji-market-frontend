'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export interface FilterOptions {
  sortBy: 'popularity' | 'timeLeft' | 'participants' | 'default';
  category?: string;
}

interface GroupBuyFilterProps {
  options: FilterOptions;
  onFilterChange: (newOptions: FilterOptions) => void;
}

export default function GroupBuyFilter({ options, onFilterChange }: GroupBuyFilterProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="w-48">
        <Select
          value={options.sortBy}
          onValueChange={(value: FilterOptions['sortBy']) =>
            onFilterChange({ ...options, sortBy: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="정렬 기준" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">기본순</SelectItem>
            <SelectItem value="popularity">인기순</SelectItem>
            <SelectItem value="timeLeft">남은 시간순</SelectItem>
            <SelectItem value="participants">참여 인원순</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
