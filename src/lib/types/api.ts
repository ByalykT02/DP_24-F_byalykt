/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  /** Indicates whether the operation was successful */
  success: boolean;
  
  /** Contains the data returned when the operation is successful */
  data?: T;
  
  /** Contains error message when the operation fails */
  error?: string;
}