export const getCurrentDate = () => {
  const now = new Date(); // Current date and time
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Add 1 to month since it's 0-indexed
  const day = String(now.getDate()).padStart(2, "0"); // Ensure 2-digit format

  // Return date in "YYYY-MM-DD" format
  return `${year}-${month}-${day}`;
};


export const getYesterdayDate= (dateString:string)=>{
  // Parse the input date
  const date = new Date(dateString);

  // Subtract one day (in milliseconds)
  date.setDate(date.getDate() - 1);

  // Extract the year, month, and day from the updated date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Ensure 2-digit month
  const day = String(date.getDate()).padStart(2, "0"); // Ensure 2-digit day

  // Return the date in "YYYY-MM-DD" format
  return `${year}-${month}-${day}`;
}