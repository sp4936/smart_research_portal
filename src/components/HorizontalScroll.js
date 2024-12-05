import React from "react";
import "./HorizontalScroll.css";

const HorizontalScroll = ({ isLoading, data, showLeadAssignment, handleAssignLead, dataType }) => {
  if (isLoading) {
    return (
      <div className="scroll-container">
        <p className="loading-message">Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="scroll-container">
        <p className="no-data-message">No data available</p>
      </div>
    );
  }

  // Dynamically generate column headers from the first data row
  const columns = Object.keys(data[0]);

  return (
    <div className="scroll-container">
      <div className="scroll-content">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{showLeadAssignment ? "Assign" : "Sr.No"}</th> {/* Toggle header text */}
                {columns.map((col, index) => (
                  <th key={index}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>
                    {showLeadAssignment ? (
                      <button
                        className="assign-button"
                        onClick={() => {
                          const payload = getPayloadByDataType(dataType, row);
                          handleAssignLead(payload);
                        }}
                      >
                        Assign
                      </button>
                    ) : (
                      rowIndex + 1 // Serial number
                    )}
                  </td>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const getPayloadByDataType = (dataType, row) => {
  switch (dataType) {
    case "COMBINED_DATA":
      return { dataType, customerName: row.CUSTOMER_NAME, certificateNumber: row.CERTIFICATE_NUMBER };
    case "SNP_GLOBAL_DATA":
      return { dataType, entityId: row.ENTITY_ID };
    case "DNB_DATA":
      return { dataType, dunsNumber: row.DUNS_NUMBER };
    default:
      throw new Error("Invalid data type");
  }
};

export default HorizontalScroll;
