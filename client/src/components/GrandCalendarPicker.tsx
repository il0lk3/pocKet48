import React, { useMemo, useState } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, SparkleIcon } from './Icons';

interface GrandCalendarPickerProps {
  id: string;
  name: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  maxDate: string; // YYYY-MM-DD
  disabled?: boolean;
  required?: boolean;
}

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = [
  { th: 'อา', en: 'Sun', isWeekend: true },
  { th: 'จ', en: 'Mon', isWeekend: false },
  { th: 'อ', en: 'Tue', isWeekend: false },
  { th: 'พ', en: 'Wed', isWeekend: false },
  { th: 'พฤ', en: 'Thu', isWeekend: false },
  { th: 'ศ', en: 'Fri', isWeekend: false },
  { th: 'ส', en: 'Sat', isWeekend: true },
];

export const GrandCalendarPicker: React.FC<GrandCalendarPickerProps> = ({
  id,
  name,
  value,
  onChange,
  maxDate,
  disabled = false,
  required = false,
}) => {
  // Parse initial selected date or fallback to maxDate
  const parsedValue = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    const [y, m, d] = maxDate.split('-').map(Number);
    return { year: y, month: m - 1, day: d };
  }, [value, maxDate]);

  // Current calendar view month and year
  const [viewYear, setViewYear] = useState<number>(parsedValue.year);
  const [viewMonth, setViewMonth] = useState<number>(parsedValue.month);

  // Synchronize view if value changes externally
  React.useEffect(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((prev) => prev - 1);
      setViewMonth(11);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((prev) => prev + 1);
      setViewMonth(0);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Quick Select Helpers
  const handleSelectDate = (dateStr: string) => {
    if (disabled || dateStr > maxDate) return;
    onChange(dateStr);
  };

  const setToday = () => {
    handleSelectDate(maxDate);
    const [y, m] = maxDate.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
  };

  const setYesterday = () => {
    const [y, m, d] = maxDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    dateObj.setUTCDate(dateObj.getUTCDate() - 1);
    const yesterdayStr = dateObj.toISOString().slice(0, 10);
    handleSelectDate(yesterdayStr);
    const [ny, nm] = yesterdayStr.split('-').map(Number);
    setViewYear(ny);
    setViewMonth(nm - 1);
  };

  // Days in month calculation
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
      isWeekend: boolean;
    }> = [];

    // Preceding days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevM = viewMonth === 0 ? 12 : viewMonth;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;
      cells.push({
        dayNumber: dayNum,
        dateStr: dStr,
        isCurrentMonth: false,
        isDisabled: true,
        isSelected: false,
        isToday: false,
        isWeekend: (cells.length % 7 === 0 || cells.length % 7 === 6),
      });
    }

    // Days in current month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;
      const dayOfWeekIndex = cells.length % 7;
      cells.push({
        dayNumber: dayNum,
        dateStr: dStr,
        isCurrentMonth: true,
        isDisabled: dStr > maxDate,
        isSelected: dStr === value,
        isToday: dStr === maxDate,
        isWeekend: dayOfWeekIndex === 0 || dayOfWeekIndex === 6,
      });
    }

    // Following days to fill final grid row
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      const nextMonthSlots = 7 - remainder;
      for (let dayNum = 1; dayNum <= nextMonthSlots; dayNum++) {
        const nextM = viewMonth === 11 ? 1 : viewMonth + 2;
        const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
        const dStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(
          dayNum
        ).padStart(2, '0')}`;
        cells.push({
          dayNumber: dayNum,
          dateStr: dStr,
          isCurrentMonth: false,
          isDisabled: true,
          isSelected: false,
          isToday: false,
          isWeekend: (cells.length % 7 === 0 || cells.length % 7 === 6),
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth, maxDate, value]);

  const thaiBuddhistYear = viewYear + 543;

  return (
    <div className="grand-calendar-widget">
      {/* Top Value Display & Input for Automated Tests & Form Submission */}
      <div className="calendar-input-bar">
        <span className="calendar-icon-lead">
          <CalendarIcon size={26} />
        </span>

        {/* Real Accessible Input Tested by Vitest / Testing Library */}
        <input
          id={id}
          name={name}
          type="date"
          max={maxDate}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className="form-input grand-calendar-native-input"
        />

        <div className="calendar-quick-chips">
          <button
            type="button"
            onClick={setToday}
            disabled={disabled}
            className={`quick-chip ${value === maxDate ? 'quick-chip-active' : ''}`}
          >
            <SparkleIcon size={12} />
            <span>วันนี้ (Today)</span>
          </button>
          <button
            type="button"
            onClick={setYesterday}
            disabled={disabled}
            className="quick-chip"
          >
            <span>เมื่อวาน (Yesterday)</span>
          </button>
        </div>
      </div>

      {/* BIG OPULENT INTERACTIVE CALENDAR BOARD */}
      <div className="grand-calendar-board">
        {/* Month Navigation Header */}
        <div className="calendar-nav-header">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={disabled}
            className="calendar-nav-arrow"
            aria-label="Previous month"
          >
            <ChevronLeftIcon size={20} />
          </button>

          <div className="calendar-month-heading">
            <span className="thai-month-label">
              {THAI_MONTHS[viewMonth]} {thaiBuddhistYear}
            </span>
            <span className="en-month-sub">
              {EN_MONTHS[viewMonth]} {viewYear}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            disabled={disabled}
            className="calendar-nav-arrow"
            aria-label="Next month"
          >
            <ChevronRightIcon size={20} />
          </button>
        </div>

        {/* Days of Week Row */}
        <div className="calendar-weekdays-row">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd.en}
              className={`weekday-label ${wd.isWeekend ? 'weekend-label' : ''}`}
            >
              <span className="th-day">{wd.th}</span>
              <span className="en-day">{wd.en}</span>
            </div>
          ))}
        </div>

        {/* Big Day Tiles Grid */}
        <div className="calendar-days-grid">
          {calendarCells.map((cell, idx) => (
            <button
              key={`${cell.dateStr}-${idx}`}
              type="button"
              disabled={cell.isDisabled || disabled}
              onClick={() => handleSelectDate(cell.dateStr)}
              className={`grand-day-cell ${
                !cell.isCurrentMonth ? 'day-other-month' : ''
              } ${cell.isSelected ? 'day-selected' : ''} ${
                cell.isToday && !cell.isSelected ? 'day-today' : ''
              } ${cell.isWeekend && cell.isCurrentMonth ? 'day-weekend' : ''}`}
            >
              <span className="day-number">{cell.dayNumber}</span>
              {cell.isToday && !cell.isSelected && (
                <span className="today-dot-indicator" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
