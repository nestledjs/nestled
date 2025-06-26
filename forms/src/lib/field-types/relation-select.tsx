import { useQuery } from '@apollo/client'
import { UptimeDocument } from '@tmi-nx-v2/shared/util-sdk'
import { Controller } from 'react-hook-form'
import { GroupBase, OptionsOrGroups } from 'react-select'
import AsyncSelect from 'react-select/async'
import { WebUiFormFieldProps } from '../web-ui-form'

function label(item: { id: string; name?: string; firstName?: string; lastName?: string }) {
  if (item?.name) {
    return item.name
  }
  if (item?.firstName && item?.lastName) {
    return `${item.firstName} ${item.lastName}`
  }
  if (item?.firstName && !item?.lastName) {
    return `${item.firstName}`
  }
  return item.id
}

function defaultOptionsMap(
  items: { id: string; name?: string; firstName?: string; lastName?: string }[],
): (any | { value?: string; label?: string })[] {
  return items?.map?.((option) => ({ value: `${option.id}`, label: label(option) } || []))
}

export function RelationSelect(props: WebUiFormFieldProps) {
  const { data, loading, refetch, error } = useQuery(props?.field?.options?.document ?? UptimeDocument)

  console.log('RelationSelect', data, loading, error)
  let dataList =
    props?.field?.options?.dataType && !loading
      ? data?.[props.field.options.dataType]
      : [{ value: '', label: 'Loading...' }]
  if (props?.field?.options?.filter && !loading) {
    dataList = props?.field?.options?.filter?.(dataList)
  }

  const defaultOptions =
    dataList?.length > 0
      ? props?.field?.options?.selectOptionsFunction
        ? props?.field?.options?.selectOptionsFunction(dataList)
        : defaultOptionsMap(dataList)
      : [{ value: '', label: 'No Matching Data Found' }]

  async function getStorageOptions(inputText: string): Promise<OptionsOrGroups<any, GroupBase<any>>> {
    return refetch({ input: { search: inputText, take: 100 } }).then((res) => {
      return props?.field?.options?.dataType
        ? props?.field?.options?.selectOptionsFunction
          ? props?.field?.options?.selectOptionsFunction(res?.data?.[props.field.options.dataType])
          : defaultOptionsMap(res?.data?.[props.field.options.dataType])
        : [{ value: '', label: 'No Matching Data Found' }]
    })
  }

  if (props.renderStatic) {
    return props.field?.options?.defaultValue?.toString()
  }

  return (
    <Controller
      control={props.control}
      name={props.field.key}
      render={({
        field: { onChange, onBlur, value, name, ref },
        fieldState: { invalid, isTouched, isDirty, error },
        formState,
      }) => (
        <AsyncSelect
          name={props.field.key}
          value={value}
          key={props.field.key}
          defaultOptions={defaultOptions}
          loadOptions={getStorageOptions}
          onChange={onChange}
          isLoading={loading}
          isMulti={props.field.options.multi}
        />
      )}
    />
    // <select
    //   id={props.field.key}
    //   className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
    //   {...props.register(`${props.field.key}`, { required: props.field?.options?.required })}
    // >
    //   {props?.field?.options?.selectOptionsFunction && props?.field?.options?.dataType
    //     ? props?.field?.options?.selectOptionsFunction(data?.[props.field.options.dataType])
    //     : null}
    // </select>
  )
}
