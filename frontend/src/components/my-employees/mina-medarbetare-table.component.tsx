import {
  ManagerEmployeeDetailMeta,
  ManagerEmployeeEmploymentDetail,
  IManagerEmployeesTable,
  ManagerEmployeesQuery,
} from '@interfaces/employee/employee';
import { useEmployeeStore } from '@services/employee-service/employee-service';
import { Button, Pagination, SortMode, Table } from '@sk-web-gui/react';
import { useRouter } from 'next/navigation';
import { UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const sortOrders: { [key: string]: 'ascending' | 'descending' } = {
    asc: 'ascending',
    desc: 'descending',
  };
  const router = useRouter();
  const setEmpIsLoading = useEmployeeStore((s) => s.setEmpIsLoading);
  const getEmployeeEmployments = useEmployeeStore((s) => s.getEmploymentsById);

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
      label: t('common:name'),
      property: 'fullName',
      isColumnSortable: true,
    },
    {
      label: t('common:personalNumber'),
      property: 'birthdate',
      isColumnSortable: true,
    },
    {
      label: t('common:workTitle'),
      property: 'title',
      isColumnSortable: true,
    },
    {
      label: t('common:unit'),
      property: 'orgName',
      isColumnSortable: true,
    },
    {
      label: t('common:showPersonalFile'),
      property: t('common:showPersonalFile'),
      isColumnSortable: false,
      screenReaderOnly: true,
      isShown: false,
    },
  ];

  const renderHeaderContent = (h: TableHeader) => {
    const isActive = formValues.OrderBy === h.property;

    if (h.screenReaderOnly) {
      return <span className="sr-only">{h.label}</span>;
    }

    if (!h.isColumnSortable) {
      return h.label;
    }

    const sortOrder = isActive ? (sortOrders[formValues.OrderDirection as string] as SortMode) : null;

    return (
      <Table.SortButton
        isActive={isActive}
        sortOrder={sortOrder}
        onClick={() => {
          setValue('OrderBy', h.property);
          setValue('OrderDirection', formValues.OrderDirection === 'ASC' ? 'DESC' : 'ASC');
        }}
      >
        {h.label}
      </Table.SortButton>
    );
  };

  const tableHeaders = (
    <Table.Header>
      {headerColumns.map((h) => (
        <Table.HeaderColumn key={`header-${h.property}`} scope="row">
          {renderHeaderContent(h)}
        </Table.HeaderColumn>
      ))}
    </Table.Header>
  );

  const renderTableColumnContent = (emp: IManagerEmployeesTable, c: TableHeader) => {
    if (c.property === 'fullName') {
      return <span className="font-bold">{emp.fullName}</span>;
    }

    if (c.property === 'knapp') {
      return (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setEmpIsLoading(false);
            getEmployeeEmployments(emp.personId ?? '');
            router.push(`mina-medarbetare/${emp.personId}`);
          }}
        >
          {t('common:showPersonalFile')}
        </Button>
      );
    }

    return <span>{emp[c.property as keyof typeof emp]}</span>;
  };

  const tableRows = (
    <Table.Body>
      {data.map((emp) => (
        <Table.Row key={`t-row-${emp.personId}`}>
          {headerColumns.map((c) => (
            <Table.Column key={`t-column-${c.property}`}>{renderTableColumnContent(emp, c)}</Table.Column>
          ))}
        </Table.Row>
      ))}
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
