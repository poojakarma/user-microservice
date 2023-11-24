import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AttendanceDto } from "src/attendance/dto/attendance.dto";
import { SuccessResponse } from "src/success-response";
import { AttendanceSearchDto } from "src/attendance/dto/attendance-search.dto";
import { SegmentDto } from "src/common-dto/userSegment.dto";
import moment from "moment";
import jwt_decode from "jwt-decode";
import { IServicelocator } from "../attendanceservicelocator";
import { UserDto } from "src/user/dto/user.dto";
import { StudentDto } from "src/student/dto/student.dto";
import { ErrorResponse } from "src/error-response";
import { AttendanceDateDto } from "src/attendance/dto/attendance-date.dto";
export const ShikshaAttendanceToken = "ShikshaAttendance";

@Injectable()
export class AttendanceHasuraService implements IServicelocator {
  constructor(private httpService: HttpService) {}
  url = `${process.env.BASEAPIURL}/Attendance`;
  studentAPIUrl = `${process.env.BASEAPIURL}/Student`;
  baseUrl = process.env.BASEAPIURL;

  public async getAttendance(
    tenantId: string,
    attendanceId: string,
    request: any
  ) {
    var axios = require("axios");
    var data = {
      query: `query GetAttendance($attendanceId:uuid!) {
        Attendance(where: {attendanceId: {_eq: $attendanceId}}) {
            attendance
            attendanceDate
            attendanceId
            tenantId
            userId
            remark
            latitude
            longitude
            image
            metaData
            syncTime
            session
            contextId
            contextType
            createdAt
            updatedAt
            createdBy
            updatedBy
        }
      }
      `,
      variables: { attendanceId: attendanceId },
    };

    var config = {
      method: "post",
      url: process.env.REGISTRYHASURA,
      headers: {
        "x-hasura-admin-secret": process.env.REGISTRYHASURAADMINSECRET,
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios(config);
    let result = response?.data?.data?.Attendance;
    const mappedResponse = await this.mappedResponse(result);

    return new SuccessResponse({
      statusCode: 200,
      message: "Ok.",
      data: mappedResponse[0],
    });
  }

  public async createAttendance(request: any, attendanceDto: AttendanceDto) {
    var axios = require("axios");
    let query = "";
    Object.keys(attendanceDto).forEach((e) => {
      if (attendanceDto[e] && attendanceDto[e] != "") {
        query += `${e}: "${attendanceDto[e]}", `;
      }
    });

    var data = {
      query: `mutation CreateAttendance {
      insert_Attendance_one(object: {${query}}) {
        attendanceId
      }
    }
    `,
      variables: {},
    };

    var config = {
      method: "post",
      url: process.env.REGISTRYHASURA,
      headers: {
        "x-hasura-admin-secret": process.env.REGISTRYHASURAADMINSECRET,
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios(config);

    if (response?.data?.errors) {
      return new ErrorResponse({
        errorCode: "400",
        errorMessage: response.data.errors[0].message,
      });
    }

    const result = response.data.data.insert_Attendance_one;

    return new SuccessResponse({
      statusCode: 200,
      message: "Ok.",
      data: result,
    });
  }

  public async updateAttendance(
    attendanceId: string,
    request: any,
    attendanceDto: AttendanceDto
  ) {
    var axios = require("axios");
    const attendanceSchema = new AttendanceDto(attendanceDto);

    let query = "";
    Object.keys(attendanceDto).forEach((e) => {
      if (
        attendanceDto[e] &&
        attendanceDto[e] != "" &&
        Object.keys(attendanceSchema).includes(e)
      ) {
        query += `${e}: "${attendanceDto[e]}", `;
      }
    });

    var data = {
      query: `mutation UpdateAttendance($attendanceId:uuid) {
          update_Attendance(where: {attendanceId: {_eq: $attendanceId}}, _set: {${query}}) {
          affected_rows
          returning {
            attendanceId
          }
        }
}`,
      variables: {
        attendanceId: attendanceId,
      },
    };

    var config = {
      method: "post",
      url: process.env.REGISTRYHASURA,
      headers: {
        "x-hasura-admin-secret": process.env.REGISTRYHASURAADMINSECRET,
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios(config);

    if (response?.data?.errors) {
      return new ErrorResponse({
        errorCode: "400",
        errorMessage: response.data.errors[0].message,
      });
    }

    const result = response.data.data.update_Attendance;

    return new SuccessResponse({
      statusCode: 200,
      message: "Ok. Updated Successfully",
      data: result,
    });
  }

  public async searchAttendance(
    tenantId: string,
    request: any,
    attendanceSearchDto: AttendanceSearchDto
  ) {
    var axios = require("axios");

    let offset = 0;
    if (attendanceSearchDto.page > 1) {
      offset =
        parseInt(attendanceSearchDto.limit) * (attendanceSearchDto.page - 1);
    }

    attendanceSearchDto.filters["tenantId"] = { _eq: tenantId ? tenantId : "" };
    console.log(
      attendanceSearchDto.filters,
      parseInt(attendanceSearchDto.limit),
      offset,
      "attendanceSearchDto.filters"
    );
    Object.keys(attendanceSearchDto.filters).forEach((item) => {
      Object.keys(attendanceSearchDto.filters[item]).forEach((e) => {
        if (!e.startsWith("_")) {
          attendanceSearchDto.filters[item][`_${e}`] =
            attendanceSearchDto.filters[item][e];
          delete attendanceSearchDto.filters[item][e];
        }
      });
    });

    var data = {
      query: `query SearchAttendance($filters:Attendance_bool_exp,$limit:Int, $offset:Int) {
        Attendance_aggregate (where:$filters, limit: $limit, offset: $offset,){
          aggregate {
            count
          }
        }
          Attendance(where:$filters, limit: $limit, offset: $offset,) {
            attendance
            attendanceDate
            attendanceId
            tenantId
            userId
            remark
            latitude
            longitude
            image
            metaData
            remark
            syncTime
            session
            contextId
            contextType
            createdAt
            updatedAt
            createdBy
            updatedBy
            }
          }`,
      variables: {
        limit: parseInt(attendanceSearchDto.limit)
          ? parseInt(attendanceSearchDto.limit)
          : 10,
        offset: offset,
        filters: attendanceSearchDto.filters,
      },
    };
    var config = {
      method: "post",
      url: process.env.REGISTRYHASURA,
      headers: {
        "x-hasura-admin-secret": process.env.REGISTRYHASURAADMINSECRET,
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios(config);

    if (response?.data?.errors) {
      return new ErrorResponse({
        errorCode: "500",
        errorMessage: response.data.errors[0].message,
      });
    }

    let result = response?.data?.data?.Attendance;

    let mappedResponse = await this.mappedResponse(result);
    const count = response?.data?.data?.Attendance_aggregate?.aggregate?.count;

    return new SuccessResponse({
      statusCode: 200,
      message: "Ok.",
      totalCount: count,
      data: mappedResponse,
    });
  }

  // need to figure out this
  public async userSegment(
    groupId: string, // cohort
    attendance: string,
    date: string,
    request: any
  ) {
    //  groupwise present absent attendance
    let axios = require("axios");
    let fromDate: any;
    let toDate: any;

    let data = {
      fromDate: fromDate,
      toDate: toDate,
      attendance: attendance,
      attendanceDate: date,
    };
    switch (date) {
      case "today":
        data = {
          ...data,
          attendanceDate: `${moment().format("Y-MM-DD")}`,
        };
        break;

      case "yesterday":
        data = {
          ...data,
          attendanceDate: `${moment().add(-1, "days").format("Y-MM-DD")}`,
        };
        break;

      case "lastthreedays":
        data = {
          ...data,
          fromDate: `${moment().add(-3, "days").format("Y-MM-DD")}`,
          toDate: `${moment().format("Y-MM-DD")}`,
          attendanceDate: "",
        };
        break;

      case "thisweek":
        data = {
          ...data,

          fromDate: moment().startOf("week").format("Y-MM-DD"),
          toDate: moment().endOf("week").format("Y-MM-DD"),
          attendanceDate: "",
        };
        break;

      case "lastweek":
        data = {
          ...data,

          fromDate: moment()
            .subtract(1, "weeks")
            .startOf("week")
            .format("YYYY-MM-DD"),
          toDate: moment()
            .subtract(1, "weeks")
            .endOf("week")
            .format("YYYY-MM-DD"),
          attendanceDate: "",
        };

        break;

      case "thismonth":
        data = {
          ...data,

          fromDate: moment().startOf("month").format("Y-MM-DD"),
          toDate: moment().endOf("month").format("Y-MM-DD"),
          attendanceDate: "",
        };
        break;

      case "lastmonth":
        data = {
          ...data,

          fromDate: moment()
            .subtract(1, "months")
            .startOf("month")
            .format("YYYY-MM-DD"),
          toDate: moment()
            .subtract(1, "months")
            .endOf("month")
            .format("YYYY-MM-DD"),
          attendanceDate: "",
        };

        break;
    }

    let newDataObject = "";
    if (data.fromDate && data.toDate) {
      newDataObject += `attendanceDate:{_gte: "${data.fromDate}"}, _and: {attendanceDate: {_lte: "${data.toDate}"}} `;
    }
    const objectKeys = Object.keys(data);
    objectKeys.forEach((e, index) => {
      if (data[e] && data[e] != "" && !["fromDate", "toDate"].includes(e)) {
        newDataObject += `${e}:{_eq:"${data[e]}"}`;
        if (index !== objectKeys.length - 1) {
          newDataObject += " ";
        }
      }
    });

    var FilterData = {
      query: `query AttendanceFilter {
            attendance(where:{ ${newDataObject}}) {
              attendance
              attendanceDate
              attendanceId
              created_at
              eventId
              groupId
              image
              latitude
              longitude
              metaData
              remark
              schoolId
              syncTime
              topicId
              updated_at
              userId
              userType
            }
          }`,
      variables: {},
    };
    var config = {
      method: "post",
      url: process.env.REGISTRYHASURA,
      headers: {
        "x-hasura-admin-secret": process.env.REGISTRYHASURAADMINSECRET,
        "Content-Type": "application/json",
      },
      data: FilterData,
    };

    let startDates: any;
    let endDates: any;

    if (data.attendanceDate === undefined) {
      startDates = "";
      endDates = "";
    } else {
      startDates = data.fromDate ? data.fromDate : "";
      endDates = data.toDate ? data.toDate : "";
    }

    const response = await axios(config);
    let resData = response?.data?.data?.attendance;

    let dateData = resData.map((e: any) => {
      return e.attendanceDate;
    });

    const groupData = await axios.get(`${this.baseUrl}/Class/${groupId}`);

    const teacherData = await axios.get(
      `${this.baseUrl}/User/${groupData.data.teacherId}`
    );

    const schoolData = await axios.get(
      `${this.baseUrl}/School/${groupData.data.schoolId}`
    );

    let arrayIds = resData.map((e: any) => {
      return e.userId;
    });

    let studentArray = [];
    for (let value of arrayIds) {
      let config = {
        method: "get",
        url: `${this.studentAPIUrl}/${value}`,
      };
      const response = await axios(config);
      const data = response?.data;

      const date = new Date(dateData[0]);
      const month = date.toLocaleString("default", { month: "long" });

      const studentDto = {
        id: data.osid,
        name: data?.firstName + " " + data?.lastName,
        phoneNo: data.guardianPhoneNumber,
        parentName: data?.guardianFirstName + " " + data?.guardianLastName,
        attendanceDate: dateData[0],
        month: month,
        teacherName:
          teacherData.data.firstName + " " + teacherData.data.lastName,
        schoolName: schoolData.data.schoolName,
        startDate: startDates,
        endDate: endDates,
      };
      let studentDtoData = new SegmentDto(studentDto);
      studentArray.push(studentDtoData);
    }

    return new SuccessResponse({
      data: studentArray,
    });
  }

  public async attendanceByDate(
    tenantId: string,
    request: any,
    attendanceSearchDto: AttendanceDateDto
  ) {
    let axios = require("axios");

    let offset = 0;
    if (attendanceSearchDto.page > 1) {
      offset =
        parseInt(attendanceSearchDto.limit) * (attendanceSearchDto.page - 1);
    }

    const filters = attendanceSearchDto.filters;

    //add tenantid
    filters["tenantId"] = { _eq: tenantId ? tenantId : "" };

    Object.keys(attendanceSearchDto.filters).forEach((item) => {
      Object.keys(attendanceSearchDto.filters[item]).forEach((e) => {
        if (!e.startsWith("_")) {
          filters[item][`_${e}`] = filters[item][e];
          delete filters[item][e];
        }
      });
    });

    const attendanceData = {
      query: `query AttendanceFilter($fromDate: date, $toDate: date, $filters: [Attendance_bool_exp!], $limit: Int, $offset: Int) {
        Attendance(where: {attendanceDate: {_gte: $fromDate, _lte: $toDate}, _and: $filters}, limit: $limit, offset: $offset) {
          attendance
          attendanceDate
          attendanceId
          tenantId
          userId
          remark
          latitude
          longitude
          image
          metaData
          syncTime
          session
          contextId
          contextType
          createdAt
          updatedAt
          createdBy
          updatedBy
        }
      }`,
      variables: {
        fromDate: attendanceSearchDto.fromDate,
        toDate: attendanceSearchDto.toDate,
        filters: filters,
        limit: parseInt(attendanceSearchDto.limit),
        offset: offset,
      },
    };
    const config = {
      method: "post",
      url: process.env.REGISTRYHASURA,
      headers: {
        "x-hasura-admin-secret": process.env.REGISTRYHASURAADMINSECRET,
        "Content-Type": "application/json",
      },
      data: attendanceData,
    };

    const response = await axios(config);

    if (response?.data?.errors) {
      return new ErrorResponse({
        errorCode: "400",
        errorMessage: response.data.errors[0].message,
      });
    }

    const result = response.data.data.Attendance;

    const mappedResponse = await this.mappedResponse(result);

    return new SuccessResponse({
      statusCode: 200,
      message: "Ok",
      totalCount: mappedResponse?.length,
      data: mappedResponse,
    });
  }

  public async checkAndAddAttendance(
    request: any,
    attendanceDto: AttendanceDto
  ) {
    // Api Checks attendance by date and userId , that is daywise attendance
    let axios = require("axios");
    try {
      const decoded: any = jwt_decode(request.headers.authorization);

      const userId =
        decoded["https://hasura.io/jwt/claims"]["x-hasura-user-id"];
      attendanceDto.createdBy = userId;
      attendanceDto.updatedBy = userId;
      const attendanceToSearch = new AttendanceSearchDto({});

      attendanceToSearch.filters = {
        attendanceDate: { _eq: attendanceDto.attendanceDate },
        userId: { _eq: attendanceDto.userId },
      };

      console.log(attendanceToSearch, "to search");
      console.log(attendanceDto);

      const attendanceFound: any = await this.searchAttendance(
        attendanceDto.tenantId,
        request,
        attendanceToSearch
      );

      if (
        attendanceFound.data.length > 0 &&
        attendanceFound.statusCode === 200
      ) {
        //  If found search data for userId and date - Update entry
        console.log(attendanceFound.data[0].attendanceId, "attendanceFound");
        return await this.updateAttendance(
          attendanceFound.data[0].attendanceId,
          request,
          attendanceDto
        );
      } else {
        // Else - Create new entry
        return await this.createAttendance(request, attendanceDto);
      }
    } catch (e) {
      console.error(e);
      return e;
    }
  }

  // bulk attendance api
  public async multipleAttendance(
    tenantId: string,
    request: any,
    attendanceData: [AttendanceDto]
  ) {
    try {
      let axios = require("axios");
      // let attendeeData = attendanceData["attendanceData"];
      const result = Promise.all(
        attendanceData.map(async (attendanceData: any) => {
          let data = {};
          data["tenantId"] = tenantId;
          data["attendanceId"] = attendanceData["attendanceId"]
            ? attendanceData["attendanceId"]
            : "";
          data["userId"] = attendanceData["userId"]
            ? attendanceData["userId"]
            : "";
          data["attendanceDate"] = attendanceData["attendanceDate"]
            ? attendanceData["attendanceDate"]
            : "";
          data["attendance"] = attendanceData["attendance"]
            ? attendanceData["attendance"]
            : "";
          data["remark"] = attendanceData["remark"]
            ? attendanceData["remark"]
            : "";
          data["latitude"] = attendanceData["latitude"]
            ? attendanceData["latitude"]
            : 0;
          data["longitude"] = attendanceData["longitude"]
            ? attendanceData["longitude"]
            : 0;
          data["image"] = attendanceData["image"]
            ? attendanceData["image"]
            : "";
          data["metaData"] = attendanceData["metaData"]
            ? attendanceData["metaData"]
            : [];
          data["syncTime"] = attendanceData["syncTime"]
            ? attendanceData["syncTime"]
            : "";
          data["session"] = attendanceData["session"]
            ? attendanceData["session"]
            : "";
          data["contextType"] = attendanceData["contextType"]
            ? attendanceData["contextType"]
            : "";
          data["contextId"] = attendanceData["contextId"]
            ? attendanceData["contextId"]
            : "";
          data["createdBy"] = attendanceData["createdBy"]
            ? attendanceData["createdBy"]
            : "";
          data["updatedBy"] = attendanceData["updatedBy"]
            ? attendanceData["updatedBy"]
            : "";

          let attendanceDto = data;
          let dataObject = "";
          const newDataObj = Object.keys(attendanceDto).forEach((e) => {
            if (attendanceDto[e] && attendanceDto[e] != "") {
              dataObject += `${e}:{_eq:"${attendanceDto[e]}"}`;
            }
          });

          var search = {
            query: `query SearchAttendance {
            Attendance(where:{ ${dataObject}}) {
              attendanceId
            }
          }`,
            variables: {},
          };
          var config = {
            method: "post",
            url: process.env.REGISTRYHASURA,
            headers: {
              "x-hasura-admin-secret": process.env.REGISTRYHASURAADMINSECRET,
              "Content-Type": "application/json",
            },
            data: search,
          };

          const responseData = await axios(config);

          let resData = await this.mappedResponse(
            responseData.data.data.Attendance
          );

          if (resData.length > 0) {
            let query = "";
            Object.keys(attendanceDto).forEach((e) => {
              if (attendanceDto[e] && attendanceDto[e] != "") {
                query += `${e}: "${attendanceDto[e]}", `;
              }
            });

            var updateQuery = {
              query: `mutation UpdateAttendance($attendanceId:uuid) {
                      update_Attendance(where: {attendanceId: {_eq: $attendanceId}}, _set: {${query}}) {
                        affected_rows
                      }
                    }`,
              variables: {
                attendanceId: resData[0].attendanceId,
              },
            };

            var update = {
              method: "post",
              url: process.env.REGISTRYHASURA,
              headers: {
                "x-hasura-admin-secret": process.env.REGISTRYHASURAADMINSECRET,
                "Content-Type": "application/json",
              },
              data: updateQuery,
            };

            const response = await axios(update);

            return await response.data.data;
          } else {
            let query = "";
            Object.keys(attendanceDto).forEach((e) => {
              if (attendanceDto[e] && attendanceDto[e] != "") {
                query += `${e}: "${attendanceDto[e]}", `;
              }
            });

            var CreateData = {
              query: `mutation CreateAttendance {
              insert_Attendance_one(object: {${query}}) {
                attendanceId
              }
            }
          `,
              variables: {},
            };

            var config = {
              method: "post",
              url: process.env.REGISTRYHASURA,
              headers: {
                "x-hasura-admin-secret": process.env.REGISTRYHASURAADMINSECRET,
                "Content-Type": "application/json",
              },
              data: CreateData,
            };

            const response = await axios(config);

            return await response.data.data.insert_Attendance_one;
          }
        })
      );

      const responseArray = await result;
      return new SuccessResponse({
        statusCode: 200,
        message: " Ok.",
        data: responseArray,
      });
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  // need to figure out this
  public async studentAttendanceByGroup(
    date: string,
    groupId: string,
    request: any
  ) {
    let axios = require("axios");
    let studentArray = [];
    const filterParams = {
      groupId,
      attendanceDate: date,
    };

    let query = "";
    Object.keys(filterParams).forEach((e) => {
      if (filterParams[e] && filterParams[e] != "") {
        query += `${e}:{_eq:"${filterParams[e]}"}`;
      }
    });

    var FilterData = {
      query: `query AttendanceFilter {
              attendance(where:{   ${query}}) {
                attendance
                attendanceDate
                attendanceId
                groupId
                schoolId
                userId
                userType
              }
            }`,
      variables: {},
    };
    var config = {
      method: "post",
      url: process.env.REGISTRYHASURA,
      headers: {
        "x-hasura-admin-secret": process.env.REGISTRYHASURAADMINSECRET,
        "Content-Type": "application/json",
      },
      data: FilterData,
    };

    const response = await axios(config);

    if (response.data.data.attendance.length > 0) {
      const studentIds = response.data.data.attendance.map((e: any) => {
        return e.userId;
      });

      for (let studentId of studentIds) {
        const studentData = await axios.get(
          `${this.studentAPIUrl}/${studentId}`,
          {
            headers: {
              Authorization: request.headers.authorization,
            },
          }
        );

        let response = await this.StudentMappedResponse([studentData.data]);
        let result = response[0];
        const updatedStudent = {
          ...result,
          attendance: response.data.data.attendance[0].attendance,
          attendanceDate: response.data.data.attendance[0].attendanceDate,
        };
        studentArray.push(updatedStudent);
      }

      return new SuccessResponse({
        statusCode: 200,
        message: "ok",
        data: studentArray,
      });
    } else {
      return new SuccessResponse({
        statusCode: 200,
        message: "Attendance not marked for this class yet",
        data: [],
      });
    }
  }

  // need to figure out this
  public async studentAttendanceByUserId(
    date: string,
    userId: string,
    request: any
  ) {
    //  returns attendance and student data
    let axios = require("axios");
    const filterParams = {
      userId,
      attendanceDate: date,
    };

    let query = "";
    Object.keys(filterParams).forEach((e) => {
      if (filterParams[e] && filterParams[e] != "") {
        query += `${e}:{_eq:"${filterParams[e]}"}`;
      }
    });

    var FilterData = {
      query: `query AttendanceFilter {
              attendance(where:{   ${query}}) {
                attendance
                attendanceDate
                attendanceId
                groupId
                schoolId
                userId
                userType
              }
            }`,
      variables: {},
    };
    var config = {
      method: "post",
      url: process.env.REGISTRYHASURA,
      headers: {
        "x-hasura-admin-secret": process.env.REGISTRYHASURAADMINSECRET,
        "Content-Type": "application/json",
      },
      data: FilterData,
    };

    const response = await axios(config);

    const studentId = response.data.data.attendance[0].userId;
    const studentData = await axios.get(`${this.studentAPIUrl}/${studentId}`, {
      headers: {
        Authorization: request.headers.authorization,
      },
    });

    let responseData = await this.StudentMappedResponse([studentData.data]);
    let result = responseData[0];
    const updatedStudent = {
      ...result,
      attendance: response.data.data.attendance[0].attendance,
      attendanceDate: response.data.data.attendance[0].attendanceDate,
    };

    return new SuccessResponse({
      statusCode: 200,
      message: "ok",
      data: updatedStudent,
    });
  }

  public async mappedResponse(result: any) {
    const attendanceResponse = result.map((item: any) => {
      const attendanceMapping = {
        tenantId: item?.tenantId ? `${item.tenantId}` : "",
        attendanceId: item?.attendanceId ? `${item.attendanceId}` : "",
        userId: item?.userId ? `${item.userId}` : "",
        attendanceDate: item?.attendanceDate ? `${item.attendanceDate}` : "",
        attendance: item?.attendance ? `${item.attendance}` : "",
        remark: item?.remark ? `${item.remark}` : "",
        latitude: item?.latitude ? item.latitude : 0,
        longitude: item?.longitude ? item.longitude : 0,
        image: item?.image ? `${item.image}` : "",
        metaData: item?.metaData ? item.metaData : [],
        syncTime: item?.syncTime ? `${item.syncTime}` : "",
        session: item?.session ? `${item.session}` : "",
        contextId: item?.contextId ? `${item.contextId}` : "",
        contextType: item?.contextType ? `${item.contextType}` : "",
        createdAt: item?.createdAt ? `${item.createdAt}` : "",
        updatedAt: item?.updatedAt ? `${item.updatedAt}` : "",
        createdBy: item?.createdBy ? `${item.createdBy}` : "",
        updatedBy: item?.updatedBy ? `${item.updatedBy}` : "",
      };

      return new AttendanceDto(attendanceMapping);
    });

    return attendanceResponse;
  }

  public async StudentMappedResponse(result: any) {
    const studentResponse = result.map((item: any) => {
      const studentMapping = {
        studentId: item?.osid ? `${item.osid}` : "",
        refId1: item?.admissionNo ? `${item.admissionNo}` : "",
        refId2: item?.refId2 ? `${item.refId2}` : "",
        aadhaar: item?.aadhaar ? `${item.aadhaar}` : "",
        firstName: item?.firstName ? `${item.firstName}` : "",
        middleName: item?.middleName ? `${item.middleName}` : "",
        lastName: item?.lastName ? `${item.lastName}` : "",
        groupId: item?.groupId ? `${item.groupId}` : "",
        schoolId: item?.schoolId ? `${item.schoolId}` : "",
        studentEmail: item?.studentEmail ? `${item.studentEmail}` : "",
        studentPhoneNumber: item?.studentPhoneNumber
          ? item.studentPhoneNumber
          : "",
        iscwsn: item?.iscwsn ? `${item.iscwsn}` : "",
        gender: item?.gender ? `${item.gender}` : "",
        socialCategory: item?.socialCategory ? `${item.socialCategory}` : "",
        religion: item?.religion ? `${item.religion}` : "",
        singleGirl: item?.singleGirl ? item.singleGirl : "",
        weight: item?.weight ? `${item.weight}` : "",
        height: item?.height ? `${item.height}` : "",
        bloodGroup: item?.bloodGroup ? `${item.bloodGroup}` : "",
        birthDate: item?.birthDate ? `${item.birthDate}` : "",
        homeless: item?.homeless ? item.homeless : "",
        bpl: item?.bpl ? item.bpl : "",
        migrant: item?.migrant ? item.migrant : "",
        status: item?.status ? `${item.status}` : "",

        fatherFirstName: item?.fatherFirstName ? `${item.fatherFirstName}` : "",

        fatherMiddleName: item?.fatherMiddleName
          ? `${item.fatherMiddleName}`
          : "",

        fatherLastName: item?.fatherLastName ? `${item.fatherLastName}` : "",
        fatherPhoneNumber: item?.fatherPhoneNumber
          ? item.fatherPhoneNumber
          : "",
        fatherEmail: item?.fatherEmail ? `${item.fatherEmail}` : "",

        motherFirstName: item?.motherFirstName ? `${item.motherFirstName}` : "",
        motherMiddleName: item?.motherMiddleName
          ? `${item.motherMiddleName}`
          : "",
        motherLastName: item?.motherLastName ? `${item.motherLastName}` : "",
        motherPhoneNumber: item?.motherPhoneNumber
          ? item.motherPhoneNumber
          : "",
        motherEmail: item?.motherEmail ? `${item.motherEmail}` : "",

        guardianFirstName: item?.guardianFirstName
          ? `${item.guardianFirstName}`
          : "",
        guardianMiddleName: item?.guardianMiddleName
          ? `${item.guardianMiddleName}`
          : "",
        guardianLastName: item?.guardianLastName
          ? `${item.guardianLastName}`
          : "",
        guardianPhoneNumber: item?.guardianPhoneNumber
          ? item.guardianPhoneNumber
          : "",
        guardianEmail: item?.guardianEmail ? `${item.guardianEmail}` : "",
        image: item?.image ? `${item.image}` : "",
        deactivationReason: item?.deactivationReason
          ? `${item.deactivationReason}`
          : "",
        studentAddress: item?.studentAddress ? `${item.studentAddress}` : "",
        village: item?.village ? `${item.village}` : "",
        block: item?.block ? `${item.block}` : "",
        district: item?.district ? `${item.district}` : "",
        stateId: item?.stateId ? `${item.stateId}` : "",
        pincode: item?.pincode ? item.pincode : "",
        locationId: item?.locationId ? `${item.locationId}` : "",
        metaData: item?.metaData ? item.metaData : [],
        createdAt: item?.osCreatedAt ? `${item.osCreatedAt}` : "",
        updatedAt: item?.osUpdatedAt ? `${item.osUpdatedAt}` : "",
        createdBy: item?.osCreatedBy ? `${item.osCreatedBy}` : "",
        updatedBy: item?.osUpdatedBy ? `${item.osUpdatedBy}` : "",
      };
      return new StudentDto(studentMapping);
    });

    return studentResponse;
  }
}
