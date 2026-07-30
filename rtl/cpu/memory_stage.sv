`timescale 1ns / 1ps

module memory_stage(

    input  logic        clk,
    input  logic        MemRead,
    input  logic        MemWrite,

    input  logic [31:0] address,
    input  logic [31:0] write_data,

    output logic [31:0] read_data

);

data_memory DMEM(

    .clk(clk),
    .MemRead(MemRead),
    .MemWrite(MemWrite),
    .address(address),
    .write_data(write_data),
    .read_data(read_data)

);

endmodule