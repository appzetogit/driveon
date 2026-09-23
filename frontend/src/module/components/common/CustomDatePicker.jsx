import { useState, useRef, useEffect } from "react";
import { colors } from "../../theme/colors";

/**
 * CustomDatePicker Component - Custom date picker with theme colors
 */
const CustomDatePicker = ({
  value,
  onChange,
  placeholder = "Select date & time",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value) : null
  );

  // Convert 24-hour to 12-hour format for display
  const get12HourFormat = (hour24) => {
    if (hour24 === 0) return { hour: 12, period: "am" };
    if (hour24 < 12) return { hour: hour24, period: "am" };
    if (hour24 === 12) return { hour: 12, period: "pm" };
    return { hour: hour24 - 12, period: "pm" };
  };

  const initialTime = selectedDate
    ? get12HourFormat(selectedDate.getHours())
    : { hour: 10, period: "am" };
  const [selectedHour, setSelectedHour] = useState(initialTime.hour);
  const [selectedMinute, setSelectedMinute] = useState(
    selectedDate ? selectedDate.getMinutes() : 30
  );
  const [selectedPeriod, setSelectedPeriod] = useState(initialTime.period);
  const [timePickerMode, setTimePickerMode] = useState("hour");
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const datePickerRef = useRef(null);
  const timePickerRef = useRef(null);

  useEffect(() => {
    if (value) {
      // Parse date string in local timezone to avoid timezone issues
      let date;
      if (typeof value === "string" && value.includes("T")) {
        // Format: YYYY-MM-DDTHH:mm
        const [datePart, timePart] = value.split("T");
        const [year, month, day] = datePart.split("-").map(Number);
        date = new Date(year, month - 1, day, 12, 0, 0);
        if (timePart) {
          const [hour, minute] = timePart.split(":").map(Number);
          date.setHours(hour || 12);
          date.setMinutes(minute || 0);
        }
      } else {
        date = new Date(value);
      }

      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        const time12 = get12HourFormat(date.getHours());
        setSelectedHour(time12.hour);
        setSelectedMinute(date.getMinutes());
        setSelectedPeriod(time12.period);
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
      if (
        timePickerRef.current &&
        !timePickerRef.current.contains(event.target)
      ) {
        setIsTimePickerOpen(false);
      }
    };

    if (isOpen || isTimePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isTimePickerOpen]);

  const formatDate = (date) => {
    if (!date) return "";
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // Convert 12-hour to 24-hour format
    let hour24 = selectedHour;
    if (selectedPeriod === "pm" && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (selectedPeriod === "am" && selectedHour === 12) {
      hour24 = 0;
    }

    const hour = String(hour24).padStart(2, "0");
    const minute = String(selectedMinute).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  const handleDateSelect = (date) => {
    // Create new date at noon to avoid timezone issues, then set time
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const newDate = new Date(year, month, day, 12, 0, 0);

    // Convert 12-hour to 24-hour format
    let hour24 = selectedHour;
    if (selectedPeriod === "pm" && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (selectedPeriod === "am" && selectedHour === 12) {
      hour24 = 0;
    }
    newDate.setHours(hour24);
    newDate.setMinutes(selectedMinute);
    setSelectedDate(newDate);
    onChange(formatDate(newDate));
  };

  const handleTimeChange = (hour, minute, period) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    if (period) setSelectedPeriod(period);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      // Convert 12-hour to 24-hour format
      let hour24 = hour;
      const finalPeriod = period || selectedPeriod;
      if (finalPeriod === "pm" && hour !== 12) {
        hour24 = hour + 12;
      } else if (finalPeriod === "am" && hour === 12) {
        hour24 = 0;
      }
      newDate.setHours(hour24);
      newDate.setMinutes(minute);
      setSelectedDate(newDate);
      onChange(formatDate(newDate));
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month - create dates at noon (12:00) to avoid timezone shift issues
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day, 12, 0, 0));
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const displayValue = selectedDate
    ? (() => {
        const day = selectedDate.getDate();
        const monthShort = monthNames[selectedDate.getMonth()].slice(0, 3);
        const year = selectedDate.getFullYear();
        const hour = String(selectedHour).padStart(2, "0");
        const minute = String(selectedMinute).padStart(2, "0");
        return `${day} ${monthShort} ${year} • ${hour}:${minute} ${selectedPeriod}`;
      })()
    : placeholder;

  return (
    <div ref={datePickerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between"
        style={{
          borderColor: colors.borderForm,
          backgroundColor: colors.backgroundSecondary,
          color: colors.textPrimary,
        }}
      >
        <span>{displayValue}</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: colors.textPrimary }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[105] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            style={{ backgroundColor: colors.backgroundSecondary }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              {/* Time Selection */}
              <div className="mb-4">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Time
                </label>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTimePickerOpen(true);
                    }}
                    className="w-auto px-4 py-2.5 rounded-xl border-2 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      borderColor: colors.backgroundTertiary,
                      backgroundColor: colors.backgroundTertiary,
                      color: colors.backgroundSecondary,
                    }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-semibold text-sm">
                      {String(selectedHour).padStart(2, "0")} :{" "}
                      {String(selectedMinute).padStart(2, "0")} {selectedPeriod}
                    </span>
                  </button>
                </div>
              </div>

              {/* Calendar */}
              <div className="mb-4">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1,
                          1
                        )
                      )
                    }
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h4
                    className="text-base font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    {monthNames[currentMonth.getMonth()]}{" "}
                    {currentMonth.getFullYear()}
                  </h4>
                  <button
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1,
                          1
                        )
                      )
                    }
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-4">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold py-1"
                      style={{ color: colors.textSecondary }}
                    >
                      {day}
                    </div>
                  ))}
                  {days.map((date, idx) => {
                    if (!date) return <div key={idx}></div>;
                    const dateYear = date.getFullYear();
                    const dateMonth = date.getMonth();
                    const dateDay = date.getDate();

                    let isSelected = false;
                    if (selectedDate) {
                      const selectedYear = selectedDate.getFullYear();
                      const selectedMonth = selectedDate.getMonth();
                      const selectedDay = selectedDate.getDate();
                      isSelected =
                        dateYear === selectedYear &&
                        dateMonth === selectedMonth &&
                        dateDay === selectedDay;
                    }

                    const today = new Date();
                    const isPast =
                      dateYear < today.getFullYear() ||
                      (dateYear === today.getFullYear() &&
                        (dateMonth < today.getMonth() ||
                          (dateMonth === today.getMonth() &&
                            dateDay < today.getDate())));

                    const isCurrentMonth =
                      dateMonth === currentMonth.getMonth();

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!isPast && isCurrentMonth) {
                            handleDateSelect(date);
                            setIsOpen(false);
                          }
                        }}
                        disabled={isPast && !isSelected}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? "text-white"
                            : isPast && !isSelected
                            ? "cursor-not-allowed"
                            : !isCurrentMonth
                            ? "opacity-40"
                            : "hover:bg-gray-100"
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? colors.backgroundTertiary
                            : "transparent",
                          color: isSelected
                            ? colors.backgroundSecondary
                            : isPast && !isSelected
                            ? colors.borderForm
                            : colors.textPrimary,
                        }}
                      >
                        {dateDay}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    onChange("");
                    setIsOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm"
                  style={{
                    borderColor: colors.backgroundTertiary,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedDate) {
                      onChange(selectedDate);
                    }
                    setIsOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Picker Popup */}
      {isTimePickerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[105] bg-black/30"
            onClick={() => setIsTimePickerOpen(false)}
          />

          <div
            ref={timePickerRef}
            className="fixed z-[110] shadow-2xl bg-white rounded-md"
            style={{
              width: "320px",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="pt-4 px-6 mb-2 mt-2">
              <h3 className="text-[10px] font-bold text-gray-500 tracking-wider mb-4 uppercase">
                Select Time
              </h3>
              
              <div className="flex items-center justify-center gap-1">
                {/* Hour */}
                <div 
                  onClick={() => setTimePickerMode('hour')}
                  className={`flex items-center justify-center w-[84px] h-[84px] rounded-lg text-5xl font-light cursor-pointer transition-colors ${timePickerMode === 'hour' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-[#e5e7eb] text-[#1c1b1f] hover:bg-gray-300'}`}
                >
                  {selectedHour}
                </div>
                
                <span className="text-5xl font-light text-[#1c1b1f] mx-1 pb-2">:</span>
                
                {/* Minute */}
                <div 
                  onClick={() => setTimePickerMode('minute')}
                  className={`flex items-center justify-center w-[84px] h-[84px] rounded-lg text-5xl font-light cursor-pointer transition-colors ${timePickerMode === 'minute' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-[#e5e7eb] text-[#1c1b1f] hover:bg-gray-300'}`}
                >
                  {String(selectedMinute).padStart(2, '0')}
                </div>
                
                {/* AM/PM */}
                <div className="flex flex-col ml-2 border border-[#79747E] rounded-md overflow-hidden">
                  <button 
                    onClick={() => handleTimeChange(selectedHour, selectedMinute, 'am')}
                    className={`px-3 py-[10px] text-[13px] font-bold transition-colors ${selectedPeriod === 'am' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-white text-[#49454f] hover:bg-gray-100'} border-b border-[#79747E]`}
                  >
                    AM
                  </button>
                  <button 
                    onClick={() => handleTimeChange(selectedHour, selectedMinute, 'pm')}
                    className={`px-3 py-[10px] text-[13px] font-bold transition-colors ${selectedPeriod === 'pm' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-white text-[#49454f] hover:bg-gray-100'}`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Clock Face */}
            <div className="px-6 py-6 flex justify-center mt-2">
              <div className="relative w-64 h-64 bg-[#e5e7eb] rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#4F378B] rounded-full absolute z-10"></div>
                {/* Draw clock numbers and hand */}
                {(() => {
                  const items = timePickerMode === 'hour' 
                    ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
                    : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
                  const radius = 104; // Radius of numbers circle
                  const cx = 128;
                  const cy = 128;
                  
                  const selectedVal = timePickerMode === 'hour' ? selectedHour : selectedMinute;
                  
                  // For minutes not exactly on a 5-minute mark, find closest angle
                  let angleDegrees = 0;
                  if (timePickerMode === 'hour') {
                    angleDegrees = (selectedVal % 12) * 30;
                  } else {
                    angleDegrees = selectedVal * 6;
                  }
                  
                  const angleRad = (angleDegrees - 90) * (Math.PI / 180);
                  const handX = cx + radius * Math.cos(angleRad);
                  const handY = cy + radius * Math.sin(angleRad);

                  return (
                    <>
                      {/* Clock Hand Line */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <line x1="128" y1="128" x2={handX} y2={handY} stroke="#4F378B" strokeWidth="2" />
                      </svg>
                      {/* Clock Selected Circle Background */}
                      <div 
                        className="absolute w-10 h-10 bg-[#4F378B] rounded-full z-0 pointer-events-none"
                        style={{
                          left: `${handX - 20}px`,
                          top: `${handY - 20}px`,
                        }}
                      ></div>

                      {/* Clock Numbers */}
                      {items.map((val, i) => {
                        const valAngle = (i * 30 - 90) * (Math.PI / 180);
                        const x = cx + radius * Math.cos(valAngle);
                        const y = cy + radius * Math.sin(valAngle);
                        const isSelected = selectedVal === val;
                        
                        return (
                          <div
                            key={val}
                            onClick={() => {
                              if (timePickerMode === 'hour') {
                                handleTimeChange(val === 0 ? 12 : val, selectedMinute, selectedPeriod);
                                setTimePickerMode('minute'); // Auto switch to minute
                              } else {
                                handleTimeChange(selectedHour, val, selectedPeriod);
                              }
                            }}
                            className={`absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center rounded-full cursor-pointer text-base z-10 transition-colors ${isSelected ? 'text-white' : 'text-[#1c1b1f] hover:bg-gray-300'}`}
                            style={{ left: `${x}px`, top: `${y}px` }}
                          >
                            {timePickerMode === 'minute' ? String(val).padStart(2, '0') : val}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between items-center px-6 pb-4 pt-2">
              {/* Keyboard Icon */}
              <svg className="w-5 h-5 text-[#49454f] cursor-pointer" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,5H4C2.895,5,2,5.895,2,7v10c0,1.105,0.895,2,2,2h16c1.105,0,2-0.895,2-2V7C22,5.895,21.105,5,20,5z M11,8h2v2h-2V8z M11,11h2v2h-2V11z M8,8h2v2H8V8z M8,11h2v2H8V11z M5,8h2v2H5V8z M5,11h2v2H5V11z M16,16H8v-2h8V16z M14,11h2v2h-2V11z M14,8h2v2h-2V8z M17,11h2v2h-2V11z M17,8h2v2h-2V8z"/>
              </svg>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimePickerOpen(false)}
                  className="font-bold text-sm text-[#4F378B] hover:bg-[#EADDFF]/50 px-4 py-2 rounded-3xl tracking-wide"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => setIsTimePickerOpen(false)}
                  className="font-bold text-sm text-[#4F378B] hover:bg-[#EADDFF]/50 px-4 py-2 rounded-3xl tracking-wide"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomDatePicker;
