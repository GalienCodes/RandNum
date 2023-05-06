import Icon from "../common/Icon";
import CsvDownloader from "react-csv-downloader";
import { useWindowWidth } from "@react-hook/window-size/throttled";

const CSVButton = ({ csvFileName, csvData }) => {
  const windowWidth = useWindowWidth();

  const mostkeys = (csvData && Array.isArray(csvData) ? csvData : [])?.sort(
    (a, b) => Object.keys(b).length - Object.keys(a).length
  )[0];

  const columns =
    mostkeys &&
    Object.keys(mostkeys)
      .filter(item => !["gameParams"].includes(item))
      .map((item, i) => {
        return {
          id: item === "_id" ? "betId" : item,
          displayName: item === "_id" ? "betId" : item,
        };
      });

  const DownloadBtn = () => {
    return (
      <button
        className="action-btn download"
        style={{
          opacity:
            csvData && Array.isArray(csvData) && Array.isArray(columns)
              ? 1
              : 0.5,
          cursor:
            csvData && Array.isArray(csvData) && Array.isArray(columns)
              ? "pointer"
              : "not-allowed",

          width: windowWidth > 722 ? "auto" : "38px",
          padding: windowWidth > 722 ? "2px 15px" : "0px 0px 0px 1.5px",
          borderRadius: windowWidth > 722 ? "8px" : "300px",
        }}
      >
        {windowWidth > 722 ? (
          <p>Download CSV</p>
        ) : (
          <>
            <Icon.Download size={14} />
          </>
        )}
      </button>
    );
  };

  return csvData && Array.isArray(csvData) && Array.isArray(columns) ? (
    Boolean(csvData?.length > 0) ? (
      <CsvDownloader
        separator=";"
        datas={csvData}
        extension=".csv"
        columns={columns}
        filename={csvFileName || "bets-history"}
      >
        <DownloadBtn />
      </CsvDownloader>
    ) : (
      <DownloadBtn />
    )
  ) : (
    <DownloadBtn />
  );
};

export default CSVButton;
