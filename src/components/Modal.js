import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const { team, industry, assets } = data || {};
  console.log(data);

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Lead Assignment Completed</h2>
        <div className="modal-content">
          {/* <p><strong>Company Name:</strong> {companyName}</p> */}
          <p><strong>Industry Type:</strong> {industry}</p>
          <p><strong>Total Assets:</strong> {assets}</p>
          <p><strong>Lead Assigned To:</strong> {team}</p>
        </div>
        <button onClick={onClose} className="modal-close-button">Close</button>
      </div>
    </div>
  );
};

export default Modal;
