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

  const getCustomerNameCell = (row) => {
    let url = '';
    if (dataType === "COMBINED_DATA") {
      if (row.SOURCE === "iBanknet" && row.SOURCE_WEBSITE) {
        url = `${row.SOURCE_WEBSITE}`;
      } else if (row.SOURCE === "FDIC" && row.CERTIFICATE_NUMBER) {
        url = `https://banks.data.fdic.gov/bankfind-suite/bankfind/details/${row.CERTIFICATE_NUMBER}`;
      } else if (row.SOURCE === "NCUA" && row.CERTIFICATE_NUMBER) {
        url = `https://www.ncua.gov/credit-union-locator/${row.CERTIFICATE_NUMBER}`;
      } else {
        console.error("Missing required fields for COMBINED_DATA:", row);
      }
    } else if (dataType === "SNP_GLOBAL_DATA") {
      if (row["Entity ID"] && row["Entity Name"]) {
        url = `https://www.capitaliq.spglobal.com/web/client#company/profile?id=${row["Entity ID"]}`;
      } else {
        console.error("Missing Entity ID or Entity Name for SNP_GLOBAL_DATA:", row);
      }
    } else if (dataType === "DNB_DATA") {
      if (row["DUNS Number"] && row["Business Name"]) {
        url = `https://app.hoovers.dnb.com/search/results/company?q=%${row["DUNS Number"]}`;
      } else {
        console.error("Missing DUNS Number or Business Name for DNB_DATA:", row);
      }
    } else {
      console.error("Unsupported dataType or missing fields:", { dataType, row });
    }

    if (url) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {row['Customer Name'] || row["Entity Name"] || row["Business Name"]}
        </a>
      );
    }

    return <span>Unknown</span>;
  };

  return (
    <div className="scroll-container">
      <div className="scroll-content">
        <div className="table-container">
          <table>
            <thead className="table-head">
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
                    <td key={colIndex}>
                      {/* Conditional rendering based on dataType and column */}
                      {col === "Customer Name" && dataType === "COMBINED_DATA" ? (
                        getCustomerNameCell(row) // Render customer name for combined data
                      ) : col === "Entity Name" && dataType === "SNP_GLOBAL_DATA" ? (
                        getCustomerNameCell(row) // Render entity name for SNP Global data
                      ) : col === "Business Name" && dataType === "DNB_DATA" ? (
                        getCustomerNameCell(row) // Render business name for DNB data
                      ) : (
                        row[col] // Default rendering for other columns
                      )}
                    </td>
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
      return { dataType, entityId: row["Entity ID"], entityName: row["Entity Name"] };
    case "DNB_DATA":
      return { dataType, dunsNumber: row["DUNS Number"], businessName: row["Business Name"] };
    default:
      throw new Error("Invalid data type");
  }
};

export default HorizontalScroll;
