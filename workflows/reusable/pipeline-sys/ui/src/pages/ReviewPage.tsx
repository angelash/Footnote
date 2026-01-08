/**
 * ReviewPage - 审查管理页面
 */

import React from 'react';
import { ReviewPanel } from '../components/Review/ReviewPanel';
import './ReviewPage.css';

export const ReviewPage: React.FC = () => {
  return (
    <div className="review-page">
      <ReviewPanel />
    </div>
  );
};

export default ReviewPage;
