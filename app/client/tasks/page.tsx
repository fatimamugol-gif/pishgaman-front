// import { format, isBefore } from 'date-fns-jalali';

// // داخل کامپوننت و در حلقه مپ تسک‌ها (task)
// const displayDate = task.due_date_iso 
//   ? format(new Date(task.due_date_iso), 'yyyy/MM/dd') 
//   : task.due_date_shamsi;

// // چک کردن وضعیت تسک‌های معوقه برای کلاینت
// const isOverdue = task.due_date_iso && isBefore(new Date(task.due_date_iso), new Date()) && task.status !== 'done';

// return (
//   <div className={`task-card ${isOverdue ? 'border-red-500 bg-red-50' : ''}`}>
//     <h4>{task.task_title}</h4>
//     <p>توضیحات: {task.description}</p>
//     <span>⏳ تاریخ سررسید: {displayDate}</span>
//     {isOverdue && <span className="text-red-600 text-xs block font-bold">⚠️ مهلت گذشته</span>}
//   </div>
// );