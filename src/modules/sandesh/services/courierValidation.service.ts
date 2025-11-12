// Courier Validation Service - Single Responsibility: Validation Logic
export class CourierValidationService {
  validateTrackingCode(tracking_no: string): void {
    if (!tracking_no || tracking_no.length > 50) {
      throw new Error('Tracking code must be less than 50 characters');
    }
  }

  validateComments(comments?: string): void {
    if (comments && comments.length > 200) {
      throw new Error('Comments must be less than 200 characters');
    }
  }

  validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      PENDING: ['RECEIVED'],
      RECEIVED: ['IN_TRANSIT'],
      IN_TRANSIT: ['DELIVERED'],
      DELIVERED: [], // Final state
    };

    const allowedNextStatuses = validTransitions[currentStatus] || [];

    if (newStatus !== currentStatus && !allowedNextStatuses.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  validateCourierType(courier_type: string): void {
    if (courier_type !== 'INCOMING' && courier_type !== 'OUTGOING') {
      throw new Error('courier_type must be INCOMING or OUTGOING');
    }
  }
}

