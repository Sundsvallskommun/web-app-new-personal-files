import {
  ManagerEmployeeDetailMeta,
  ManagerEmployeeEmploymentDetail,
  IManagerEmployeesTable,
  ManagerEmployeesQuery,
} from '@interfaces/employee/employee';
import { Button, Pagination, SortMode, Table } from '@sk-web-gui/react';
import { UseFormSetValue } from 'react-hook-form';

export interface TableHeader {
  label: string;
  property: string;
  isColumnSortable?: boolean;
  isShown?: boolean;
  screenReaderOnly?: boolean;
  sticky?: boolean;
}

export const ManagerEmployeesTable: React.FC<{
  managerEmployees: ManagerEmployeeDetailMeta;
  formValues: ManagerEmployeesQuery;
  setValue: UseFormSetValue<ManagerEmployeesQuery>;
}> = ({ managerEmployees, formValues, setValue }) => {
  const sortOrders: { [key: string]: 'ascending' | 'descending' } = {
    asc: 'ascending',
    desc: 'descending',
  };

  const tableData = () => {
    const data: IManagerEmployeesTable[] = [];
    let empDetail: ManagerEmployeeEmploymentDetail;
    managerEmployees.data?.forEach((el) => {
      el.employments?.filter((emp) => {
        if (emp.isMainEmployment) empDetail = emp;
      });

      data.push({
        personId: el.personId,
        fullName: el.fullName,
        birthdate: `${el.birthdate}****`,
        employmentId: empDetail.employmentId,
        title: empDetail.title,
        orgName: empDetail.orgName,
      });
    });

    return { data };
  };

  const { data } = tableData();

  const headerColumns: TableHeader[] = [
    {
      label: 'Namn',
      property: 'fullName',
      isColumnSortable: true,
    },
    {
      label: 'Personnummer',
      property: 'birthdate',
      isColumnSortable: true,
    },
    {
      label: 'Anställningstitel',
      property: 'title',
      isColumnSortable: true,
    },
    {
      label: 'Enhet',
      property: 'orgName',
      isColumnSortable: true,
    },
    {
      label: 'knapp',
      property: 'knapp',
      isColumnSortable: false,
      screenReaderOnly: true,
      isShown: false,
    },
  ];

  const tableHeaders = (
    <Table.Header>
      {headerColumns.map((h, hidx) => {
        const isActive = formValues.OrderBy === h.property;
        return (
          <Table.HeaderColumn key={`header-${hidx}`} scope="row">
            {h.screenReaderOnly ? (
              <span className="sr-only">{h.label}</span>
            ) : h.isColumnSortable ? (
              <Table.SortButton
                isActive={isActive}
                sortOrder={isActive ? (sortOrders[formValues.OrderDirection as string] as SortMode) : null}
                onClick={() => {
                  setValue('OrderBy', h.property);
                  setValue('OrderDirection', formValues.OrderDirection === 'ASC' ? 'DESC' : 'ASC');
                }}
              >
                {h.label}
              </Table.SortButton>
            ) : (
              h.label
            )}
          </Table.HeaderColumn>
        );
      })}
    </Table.Header>
  );

  const tableRows = (
    <Table.Body>
      {data.map((emp, eidx) => {
        return (
          <Table.Row key={`t-row-${eidx}`}>
            {headerColumns.map((c, cidx) => {
              return c.property === 'fullName' ? (
                <Table.Column key={`t-column-${cidx}`}>
                  <span className="font-bold">{emp.fullName}</span>
                </Table.Column>
              ) : (
                <Table.Column>
                  {c.property === 'knapp' ? (
                    <Button variant="secondary" size="sm">
                      Visa personakt
                    </Button>
                  ) : (
                    <span>{emp[c.property as keyof typeof emp]}</span>
                  )}
                </Table.Column>
              );
            })}
          </Table.Row>
        );
      })}
    </Table.Body>
  );
  return (
    <Table>
      {tableHeaders}
      {tableRows}
      <Table.Footer>
        <div className="sk-table-bottom-section-spacer"></div>
        <div className="sk-table-paginationwrapper">
          <Pagination
            className="sk-table-pagination"
            pagesBefore={1}
            pagesAfter={1}
            pages={managerEmployees.totalPages}
            activePage={managerEmployees.pageNumber}
            changePage={(page) => setValue('PageNumber', page)}
            showConstantPages
            fitContainer
          />
        </div>
        <div className="sk-table-bottom-section-spacer"></div>
      </Table.Footer>
    </Table>
  );
};
